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
| **Node** | One step inside a workflow. Four kinds: a **connector-operation node** (an operation of a configured connector), a **raw request node** ("pure" — no invoker/connector config behind it: the user defines target, headers/metadata, and body directly; HTTP(S) first, transport-protocol pluggable), and the flow operators **IF** and **LOOP**. A fifth kind, the **Wait-for-Human node** (pauses the execution until a human response arrives — decision #12), is planned on the redesign roadmap. Edges between nodes are just that — graph edges, not "Connections" in the legacy sense. |

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
| `core` | Boot app (`oc-app.jar`), port 9090 | The control plane: Security Filter Chain (pluggable authentication strategies per deployment mode — JWT · OIDC · LDAP · Service Portal · 2FA/TOTP; decision #10), REST API, WebSocket Gateway (STOMP, JWT handshake, live streams), ACL/permissions, invoker/connector/workflow management, triggers (Quartz · webhook · manual · test), Global Params, **Log Aggregation** (consumes worker events → Mongo metadata + live status), and the **Execution Dispatcher** (transport SPI). Only core touches MongoDB — statically in self-hosted mode, via per-tenant routing in cloud mode (decision #11). |
| `worker` | Boot app (`oc-worker.jar`), port 9091 | Stateless, fully isolated engine host: a **Transport Endpoint** consumes self-contained job messages and publishes everything back as events (results, logs, state transitions, variable updates, heartbeats — see the event vocabulary below). No MongoDB access, no persistent state — local log files are a transient spool. Exists purely for horizontal scaling. |

### Workflow graph semantics

A workflow is a true DAG, not a chain:

- **One or more start nodes.** A workflow can have several entry points — the DAG may have multiple sources, all activated when the workflow starts. (In the promise model these are simply the nodes whose input promises are already resolved at launch.)
- **Fan-out / parallel paths.** A node's output can feed several branches that execute simultaneously — e.g. data fetched from one API delivered to four different APIs at once. Branches may **converge into a single end node** (an AND-join: the joining node waits for all incoming branches) or simply run to their own ends without joining.
- **Multi-connector.** Nodes in one workflow freely belong to different connectors; the engine bounds concurrency per external system so parallelism never overwhelms one target API.
- **Parallel LOOP.** Iterations can run concurrently as batch requests; the degree of parallelism is configurable per LOOP node (with safe defaults), on top of the per-external-system bound.
- **Raw request node.** Carries its own target/headers/body with OCEL templating, independent of any invoker/connector. HTTP(S) is the first supported protocol; the Request Builder is designed so other transport protocols can be added.

**Where new code goes:** shared contracts → `common`; anything about *running* workflows → `execution`; anything users/frontend interact with → `core`; `worker` grows only wiring. If a class could go two places, putting it lower in the diagram keeps more options open.

### Package structure

Baseline layout for the redesign roadmap (to be confirmed/refined in the ST-01 design review). Every roadmap story lands as a *package inside an existing module* — never a new module, never a changed dependency direction. Additions driven by decisions #10–12 are marked *(new)*.

```
io.opencelium.common            contracts only — framework-light
├── workflow                    node/edge model; node kinds incl. Wait-for-Human
├── invoker · connector         descriptors
├── acl                         subjects, permission levels View…Admin (decision #7)
├── tenant                      tenant context contract (new — decision #11)
├── secret                      SecretProvider SPI
└── transport                   SPI + job message + event vocabulary:
                                results · logs · state · variable-update · heartbeat · audit

io.opencelium.execution         engine library — runs identically in both apps
├── engine                      promise graph, DAG scheduler, prepare/execute (decision #8)
├── node                        connector-op, raw request, IF, LOOP, wait
├── state                       state machine + checkpoint/reconstruction (new — decision #12)
├── debug                       debug sessions, breakpoints, pause/continue (new)
├── request                     Request Builder, OCEL, RestClient
└── logging                     OcLogger, spool

io.opencelium.core              package-per-feature-module (modular monolith, decision #1)
├── auth                        pluggable strategies: local · LDAP · OIDC · Service Portal (decision #10)
├── authz                       RBAC + ACL enforcement, one authorization manager
├── tenant                      cloud bootstrap, dynamic per-tenant Mongo routing (new — decision #11)
├── workflow · connector · invoker   management CRUD
├── trigger                     Quartz, webhook, manual, test
├── dispatch                    Execution Dispatcher over the transport SPI
├── variables                   Global Params store + resolution
├── monitoring                  execution state API, live streams, log aggregation
├── notification                NotificationChannel SPI: email, Slack, …
├── admin                       service/worker status, queued jobs (new)
├── audit                       append-only store + query API (new)
└── config                      opencelium.* properties, secret provider impl

io.opencelium.worker            wiring only — deliberately grows nothing
```

Open placement calls for the ST-01 design review: (a) where transport *implementations* live — `local` naturally sits in `execution`; `amqp` in `execution` or its own package, but never in `core`, or workers can't use it; (b) per-feature Mongo repositories inside each core feature package (preferred — keeps each seam self-contained) vs. a shared persistence package. Neither call moves anything on the roadmap.

## Deployment shapes & transport SPI

Both shapes are first-class and must always keep working. The switch is **runtime configuration, not a build variant** — one `./gradlew build`, same commit, same version, produces the monolith jar alone or both jars.

Dispatch goes through a **pluggable transport SPI**:

| Shape | Artifacts | Transport |
|---|---|---|
| **Monolith** — small installs | `oc-app.jar` (`:core:bootJar`) | `local` (default) — the Dispatcher calls the executor in-process. Zero infrastructure beyond MongoDB. |
| **Distributed** — scaled installs | `oc-app.jar` + N × `oc-worker.jar` | `amqp` — the Dispatcher publishes **self-contained jobs** (workflow snapshot + credentials + global params, encrypted on the broker) to a message broker (RabbitMQ / any AMQP); workers consume with at-least-once delivery and publish results/logs as events. |
| **Custom** — special environments | same as distributed | `custom` — users plug their own transport (Kafka, SQS, …) via the SPI. |

There is deliberately **no HTTP dispatch path** — workers are consumers, not servers. Live-run streams reach the frontend as broker events → core's Log Aggregation → WebSocket Gateway; WebSocket sessions live only in core, never fed from worker memory.

**Worker → core event vocabulary.** One pipe, several event families: execution **results**, **log** streams, execution **state transitions** (feeding the state machine of decision #12, including checkpoints), **variable updates** (Global Params written mid-execution — workers never write MongoDB, so variable writes travel as events and core persists them), **worker heartbeat/registration** (dynamic membership; feeds the admin status view), and **audit events**. New needs extend this vocabulary — they never open a side channel around the transport.

**Tenancy is orthogonal to deployment shape.** Either shape runs single-tenant (self-hosted) or multi-tenant (cloud — decision #11). The tenant ID travels inside job messages and events, so transports and workers need no tenant awareness of their own.

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
10. **Authentication is a pluggable strategy, separate from authorization.** *(Added 2026-09-08 for the redesign roadmap.)* Authentication produces a principal (identity, tenant, group/claim mappings); authorization (RBAC + ACLs, #7) consumes it — no permission logic in security filters, and neither side knows the other's internals. Which strategies are active is deployment-mode configuration, like the transport switch (#2): self-hosted — local credentials, LDAP, optionally OIDC; cloud — the external **Service Portal** (its login response supplies the tenant identifier and database information, feeding #11) and OIDC. External IdPs map claims → users/groups with JIT provisioning; 2FA/TOTP layers on the local strategy.
11. **Tenant context is first-class; cloud mode bootstraps without a database.** *(Added 2026-09-08 for the redesign roadmap.)* Two tenancy modes, switched by runtime config: **self-hosted** — single tenant, static MongoDB connection at startup (today's behavior, unchanged); **cloud** — core starts with *no* database connection (health endpoints and auth bootstrap work pre-DB), a Service Portal login (#10) supplies tenant ID + database information, and core establishes per-tenant `MongoClient`/database routing dynamically. The tenant ID lives in the principal, on every persisted document (workflows, connectors, executions, variables, ACL entries, audit records), inside the self-contained job message, and on every event a worker publishes — the engine and transports stay tenant-agnostic while isolation is enforced at the persistence and API layers. **Tenant-keyed is part of every story's definition of done**: new collections, APIs, and permission checks carry the tenant ID from birth, so multi-tenant hardening verifies isolation instead of retrofitting it.
12. **Executions are checkpointable; the promise graph is reconstructible.** *(Added 2026-09-08 for the redesign roadmap — extends #8.)* Above #8's node states sits an execution-level state machine: `RUNNING → PAUSED | WAITING | COMPLETED | FAILED` (`PAUSED` = debugger breakpoint, `WAITING` = Wait-for-Human), with transitions and checkpoints flowing as events to core, which persists them in Mongo at node-completion granularity. The engine can rebuild a promise graph from a checkpoint: completed nodes' promises start pre-resolved, and execution continues from the frontier. This — not in-memory promises held indefinitely — is what lets a workflow wait days on a human response without pinning threads, survive core/worker restarts, and resume on a *different* worker (a resume job message carries the checkpoint: #9's self-contained rule extended to resumes). The **Execution Debugger** is the same mechanism driven interactively on the `local` transport: a breakpoint pauses, the UI inspects node state and variables via #8's inspectability, and *continue* resolves the held promise. Checkpoint/resume design lives inside the **Execution Debugger** story (roadmap ST-07), landing before its consumers — restart recovery (ST-08) and the Wait-for-Human node (ST-10); the execution refactor (ST-05) leaves the checkpoint seam open in the state machine rather than designing it.
