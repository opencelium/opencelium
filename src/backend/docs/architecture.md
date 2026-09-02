# Backend architecture

How the OpenCelium backend is structured and why. The contribution rules that follow from this structure live in [CONTRIBUTING.md](../CONTRIBUTING.md); this document explains the system itself.

## What OpenCelium is

An API integration / workflow-automation platform in the spirit of n8n. Users define **nodes** (API operations), wire them into **workflows**, and data fetched from one API is transformed and sent to another. Workflows support two flow operators: **IF** (decision/branching) and **LOOP** (iteration over collections).

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
| `common` | Library | The shared vocabulary: workflow definition model (workflows, nodes, connections), node type descriptors, and the DTOs core and workers exchange (execution requests/results). Framework-light by design. |
| `execution` | Library | The workflow execution engine: walks the graph, executes nodes (HTTP via Spring `RestClient`), evaluates IF, iterates LOOP. Not runnable on its own — it is embedded by an app. Beans live under `io.opencelium.execution` and are component-scanned by whichever app embeds it. |
| `core` | Boot app, port 9090 | The control plane: REST API for the frontend, MongoDB persistence, authentication (Spring Security + LDAP), workflow/node definition management, scheduling, and dispatching executions (in-process or to workers). |
| `worker` | Boot app, port 9091 | The `execution` engine with a power button: a thin service that accepts execution requests and runs them. Exists purely for horizontal scaling. Stays nearly empty. |

**Where new code goes:** shared contracts → `common`; anything about *running* workflows → `execution`; anything users/frontend interact with → `core`; `worker` grows only wiring. If a class could go two places, putting it lower in the diagram keeps more options open.

## Deployment shapes

Both shapes are first-class and must always keep working. The switch is **runtime configuration, not a build variant** — the same core jar serves both.

| Shape | Artifacts | Config |
|---|---|---|
| **Single jar** — small installs | `:core:bootJar` | `opencelium.execution.mode: embedded` (default) — core runs workflows in-process via its embedded engine. |
| **Two jars** — scaled installs | `:core:bootJar` + N × `:worker:bootJar` | `opencelium.execution.mode: remote` — core dispatches executions to worker instances. |

This is why the engine is a library: the same execution code compiles into both apps, so embedded and remote mode cannot drift apart — provided execution features are added to `execution`, never directly to `core` or `worker`.

## Test strategy per module

A test lives in the module of the code it tests — but not every module gets every kind of test:

| Module | Unit | Slice | Integration (`*IT`) | Why |
|---|---|---|---|---|
| `common` | ✅ only | — | — | Plain data model: nothing to slice, nothing to boot. |
| `execution` | ✅ only | — | — | A library with no application to start. Engine, IF, LOOP are tested with `new` + Mockito; external APIs are mocked at the `RestClient` seam. Wanting `@SpringBootTest` here signals code is in the wrong module. |
| `core` | ✅ | ✅ | ✅ | The full app: unit tests for services, `@WebMvcTest`/`@DataMongoTest` slices, Testcontainers `*IT`s for end-to-end paths. |
| `worker` | ✅ | ✅ | ✅ | Same kinds as core, far fewer of them — it's a thin wrapper. |

Deliberate consequence: the bulk of product logic (graph walking, IF, LOOP, mapping) lives in the two unit-only modules, so most tests are the millisecond kind. The slow Testcontainers suite stays small and answers one question: does API + Mongo + engine actually work together. Mechanics (source roots, naming, `testutil/`) are in CONTRIBUTING §9.

## Design decisions

Recorded so they don't get relitigated ad hoc. Any of these can be revisited — deliberately, with a ticket.

1. **Modular monolith, not microservices.** One deployable by default, compiler-enforced internal boundaries. Actual microservices (auth service, scheduler service, ...) would add operational cost with no benefit at this scale. The only split that pays for itself is the one along the two workloads — manage vs. execute — and even that is optional at runtime.
2. **Deployment shape is runtime config, not a build variant.** Two different builds would mean testing two artifacts forever; one artifact with a `mode` flag is one artifact to trust.
3. **Engine as a library, apps as thin hosts.** Guarantees embedded and remote execution share one implementation, and forces engine logic to be unit-testable without booting Spring.
4. **HTTP dispatch to workers first; queue later if needed.** A broker (RabbitMQ/Kafka-style queueing) buys retries and backpressure at real scale, but costs an infrastructure dependency on day one — embedded mode must stay zero-infrastructure. Revisit when remote-mode load justifies it.
5. **Tests mirror the production package** (no `unit.*`/`slice.*` subpackages, unlike legacy OC 5.1): keeps package-private access; module boundaries plus `*Test`/`*IT` suffixes already route tests.
6. **Ground-up rewrite.** Legacy OpenCelium code is reference material for analysis only — its concepts inform design; its code and patterns are never ported.
