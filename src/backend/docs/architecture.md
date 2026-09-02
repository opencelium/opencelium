# Backend architecture

> Visual version: [architecture.drawio](architecture.drawio) (open with [diagrams.net](https://app.diagrams.net) or the drawio IDE plugin).

How the OpenCelium backend is structured and why. The contribution rules that follow from this structure live in [CONTRIBUTING.md](../CONTRIBUTING.md); this document explains the system itself.

## What OpenCelium is

An API integration / workflow-automation platform in the spirit of n8n. Users register **invokers**, configure **connectors**, and build **workflows** in which data fetched from one API is transformed and sent to another. Workflows support two flow operators: **IF** (decision/branching) and **LOOP** (iteration over collections).

### Glossary

Deliberately retained OpenCelium vocabulary (domain terms carry team knowledge; only legacy *code* is off-limits):

| Term | Meaning |
|---|---|
| **Invoker** | The description of an external API — which operations it offers (the node type descriptor). |
| **Connector** | An invoker bound to a concrete installation: endpoint + credentials. What users configure. |
| **Workflow** | The executable graph of nodes with IF/LOOP operators. Replaces the OC 5.x term *Connection* — a workflow is the general form of the old two-connector integration. |
| **Node** | One step inside a workflow. Four kinds: a **connector-operation node** (an operation of a configured connector), a **raw request node** ("pure" — no invoker/connector config behind it: the user defines target, headers/metadata, and body directly; HTTP(S) first, transport-protocol pluggable), and the flow operators **IF** and **LOOP**. Edges between nodes are just that — graph edges, not "Connections" in the legacy sense. |

The platform has two fundamentally different workloads:

1. **Managing** — users create connectors, design workflows, schedule them (interactive, low volume).
2. **Executing** — workflows actually run: call APIs, evaluate IFs, iterate LOOPs (batch-like, scales with data volume).

The architecture separates these two workloads. Everything else follows from that.

## The four modules

```
        ┌──────────┐          ┌──────────┐
        │   core   │          │  worker  │      Spring Boot apps (bootJar)
        │ :9090    │          │ :9091    │
        └────┬─────┘          └────┬─────┘
             │                     │
             ▼                     ▼
        ┌─────────────────────────────┐
        │         execution           │          library (plain jar)
        │  engine · nodes · IF · LOOP │
        └──────────────┬──────────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │           common            │          library (plain jar)
        │  workflow model · DTOs      │
        └─────────────────────────────┘
```

Dependencies point only downward. Nothing depends on `core` or `worker`.

| Module | Kind | Responsibility |
|---|---|---|
| `common` | Library | The shared vocabulary: workflow definition model (workflows, nodes, edges), invoker/connector descriptors, the access-control model (scopes, ACL entries), and the DTOs core and workers exchange (execution requests/results). Framework-light by design. |
| `execution` | Library | The workflow execution engine, built on **promise-based dataflow scheduling** (decision #8): **DAG Scheduler** (data + control dependencies decide order; independent nodes and loop iterations run concurrently, bounded per external system; same-connector writes stay ordered unless a branch is marked parallel-safe), **Workflow Executor** (nodes, IF/LOOP operators), **Request Builder** (OCEL expression evaluation; HTTP(S) via Spring `RestClient` first, transport-protocol pluggable), and **OcLogger** (per-execution log stream, spooled to local files and published as events). Not runnable on its own — beans live under `io.opencelium.execution` and are component-scanned by whichever app embeds it. |
| `core` | Boot app (`oc-app.jar`), port 9090 | The control plane: Security Filter Chain (JWT · OIDC · LDAP · 2FA/TOTP), REST API, WebSocket Gateway (STOMP, JWT handshake, live streams), ACL/permissions, invoker/connector/workflow management, triggers (Quartz · webhook · manual · test), Global Params, **Log Aggregation** (consumes worker events → Mongo metadata + live status), and the **Execution Dispatcher** (transport SPI). Only core touches MongoDB. |
| `worker` | Boot app (`oc-worker.jar`), port 9091 | Stateless, fully isolated engine host: a **Transport Endpoint** consumes self-contained job messages and publishes results/logs as events. No MongoDB access, no persistent state — local log files are a transient spool. Exists purely for horizontal scaling. |

### Workflow graph semantics

A workflow is a true DAG, not a chain:

- **One start node.** Exactly one entry point per workflow.
- **Fan-out / parallel paths.** A node's output can feed several branches that execute simultaneously — e.g. data fetched from one API delivered to four different APIs at once. Branches may **converge into a single end node** (an AND-join: the joining node waits for all incoming branches) or simply run to their own ends without joining.
- **Multi-connector.** Nodes in one workflow freely belong to different connectors; the engine bounds concurrency per external system so parallelism never overwhelms one target API.
- **Parallel LOOP.** Iterations can run concurrently as batch requests; the degree of parallelism is configurable per LOOP node (with safe defaults), on top of the per-external-system bound.
- **Raw request node.** Carries its own target/headers/body with OCEL templating, independent of any invoker/connector. HTTP(S) is the first supported protocol; the Request Builder is designed so other transport protocols can be added.

**Where new code goes:** shared contracts → `common`; anything about *running* workflows → `execution`; anything users/frontend interact with → `core`; `worker` grows only wiring. If a class could go two places, putting it lower in the diagram keeps more options open.

## Deployment shapes & transport SPI

Both shapes are first-class and must always keep working. The switch is **runtime configuration, not a build variant** — one `./gradlew build`, same commit, same version, produces the monolith jar alone or both jars.

Dispatch goes through a **pluggable transport SPI**:

| Shape | Artifacts | Transport |
|---|---|---|
| **Monolith** — small installs | `oc-app.jar` (`:core:bootJar`) | `local` (default) — the Dispatcher calls the executor in-process. Zero infrastructure beyond MongoDB. |
| **Distributed** — scaled installs | `oc-app.jar` + N × `oc-worker.jar` | `amqp` — the Dispatcher publishes **self-contained jobs** (workflow snapshot + credentials + global params, encrypted on the broker) to a message broker (RabbitMQ / any AMQP); workers consume with at-least-once delivery and publish results/logs as events. |
| **Custom** — special environments | same as distributed | `custom` — users plug their own transport (Kafka, SQS, …) via the SPI. |

There is deliberately **no HTTP dispatch path** — workers are consumers, not servers. Live-run streams reach the frontend as broker events → core's Log Aggregation → WebSocket Gateway; WebSocket sessions live only in core, never fed from worker memory.

This is why the engine is a library: the same execution code compiles into both apps, so local and brokered execution cannot drift apart — provided execution features are added to `execution` (transport SPI contracts to `common`), never directly to `core` or `worker`.

## Test strategy per module

A test lives in the module of the code it tests — but not every module gets every kind of test:

| Module | Unit | Slice | Integration (`*IT`) | Why |
|---|---|---|---|---|
| `common` | ✅ only | — | — | Plain data model: nothing to slice, nothing to boot. |
| `execution` | ✅ only | — | — | A library with no application to start. Engine, IF, LOOP are tested with `new` + Mockito; external APIs are mocked at the `RestClient` seam. Promise-graph tests resolve node promises in controlled and adversarial orders (right branch before left, failure mid-join) — executor and clock are injected, never hard-coded. Wanting `@SpringBootTest` here signals code is in the wrong module. |
| `core` | ✅ | ✅ | ✅ | The full app: unit tests for services, `@WebMvcTest`/`@DataMongoTest` slices, Testcontainers `*IT`s for end-to-end paths. |
| `worker` | ✅ | ✅ | ✅ | Same kinds as core, far fewer of them — it's a thin wrapper. |

Deliberate consequence: the bulk of product logic (graph walking, IF, LOOP, mapping) lives in the two unit-only modules, so most tests are the millisecond kind. The slow Testcontainers suite stays small and answers one question: does API + Mongo + engine actually work together. Mechanics (source roots, naming, `testutil/`) are in CONTRIBUTING §9.

## Design decisions

Recorded so they don't get relitigated ad hoc. Any of these can be revisited — deliberately, with a ticket.

1. **Modular monolith, not microservices.** One deployable by default, compiler-enforced internal boundaries. Actual microservices (auth service, scheduler service, ...) would add operational cost with no benefit at this scale. The only split that pays for itself is the one along the two workloads — manage vs. execute — and even that is optional at runtime.
2. **Deployment shape is runtime config, not a build variant.** Two different builds would mean testing two artifacts forever; one artifact with a transport setting is one artifact to trust.
3. **Engine as a library, apps as thin hosts.** Guarantees local and brokered execution share one implementation, and forces engine logic to be unit-testable without booting Spring.
4. **Dispatch via pluggable transport SPI: `local | amqp | custom`.** *(Revised 2026-09-02 per PM's v2 design — supersedes the earlier "HTTP first, queue later" decision.)* Monolith mode uses the in-process `local` transport (zero infrastructure); distributed mode requires a message broker (`amqp`, at-least-once delivery); the SPI lets users plug Kafka/SQS/etc. There is no HTTP dispatch path — workers are consumers, not servers.
5. **Tests mirror the production package** (no `unit.*`/`slice.*` subpackages, unlike legacy OC 5.1): keeps package-private access; module boundaries plus `*Test`/`*IT` suffixes already route tests.
6. **Ground-up rewrite.** Legacy OpenCelium code is reference material for analysis only — its concepts inform design; its code and patterns are never ported. Domain vocabulary (invoker, connector) is deliberately retained — see the glossary.
7. **Platform-wide access control: RBAC + per-resource ACLs** *(PM requirement)*. RBAC (component × action) provides the coarse layer; every resource — workflow, connector, invoker, data-store entry — additionally carries an ACL (subject → permission → this resource). **First increment (v2 design): per-workflow ACLs** stored on each workflow document, enforced in Mongo queries, REST, and WebSocket topic subscriptions; execution logs inherit the workflow's ACL. Enforcement lives in core (API access) and in the execution engine (parameter/credential resolution at runtime, identically in both transports) — so the ACL model itself belongs in `common`. Detailed design (permission set, extension to other resources, secret encryption, log masking) is a pending design session — its agenda also includes: the job message contract (codec seam — JSON first, protobuf as a possible transport codec, never the domain model), payload encryption & key distribution, idempotent job consumption under at-least-once delivery, raw-request-node credential hygiene (reference the guarded store via OCEL instead of plaintext tokens in headers; note a raw node has no connector ACL to inherit), and per-LOOP parallelism defaults.
8. **Promise-based (dataflow) execution.** The engine executes a workflow as a promise graph, never by blocking waits. Each node has a two-phase lifecycle: **prepare** (eager: parse the node, pre-evaluate what OCEL can already resolve, identify missing inputs, subscribe to the promises that will deliver them — then move on to prepare other nodes) and **execute** (triggered: when the last input promise resolves, the node is notified, placeholders are replaced with real data, and the request fires). Fan-out is multiple subscribers on one promise; the AND-join is `allOf` over branch promises; parallel LOOP is a bounded batch of iteration promises. Implementation: promises (`CompletableFuture`-style) for coordination, **virtual threads** for the actual work (sequential-looking code inside a node), **structured concurrency** for branch scopes so a failed branch cancels its racing siblings — no reactive framework. Eagerness is bounded: LOOP iterations are prepared lazily in windows, never all 50k up front. Every promise/node carries execution ID + node ID into logs and events, and node state (prepared / waiting-on / running / done / failed) is inspectable — this feeds the live WebSocket stream. Engine tests must be able to resolve promises in controlled (including adversarial) orders — executor and clock are always injected.
9. **Workers are fully isolated and stateless.** No MongoDB access, no persistent state: the job message is self-contained (workflow snapshot + credentials + global params, encrypted on the broker) and everything leaves the worker as events; local log files are a transient spool. This keeps workers disposable and horizontally scalable, and prevents core-only infrastructure from leaking into the engine.
