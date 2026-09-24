# Backend architecture

> Visual version: [architecture.drawio](architecture.drawio) (open with [diagrams.net](https://app.diagrams.net) or the drawio IDE plugin).

How the OpenCelium backend is structured and why. The contribution rules that follow from this structure live in [CONTRIBUTING.md](../CONTRIBUTING.md); this document explains the system itself.

## Contents

- [What OpenCelium is](#what-opencelium-is) · [Glossary](#glossary)
- [The four modules](#the-four-modules) · [Workflow graph semantics](#workflow-graph-semantics) · [Package structure](#package-structure)
- [Deployment shapes & transport SPI](#deployment-shapes--transport-spi)
- [Configuration & secrets placement](#configuration--secrets-placement) · [The three placement questions](#the-three-placement-questions) · [Examples](#examples) · [Adding a new value](#adding-a-new-value)
- [Test strategy per module](#test-strategy-per-module)
- [Design decisions](#design-decisions)

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
| `core` | Boot app (`oc-app.jar`), port 9090 | The management app: Security Filter Chain (pluggable authentication strategies per deployment mode — JWT · OIDC · LDAP · Service Portal · 2FA/TOTP; decision #10), REST API, WebSocket Gateway (STOMP, JWT handshake, live streams), ACL/permissions, invoker/connector/workflow management, triggers (Quartz · webhook · manual · test), Global Params, **Log Aggregation** (consumes worker events → Mongo metadata + live status), and the **Execution Dispatcher** (transport SPI). Only core touches MongoDB — statically in self-hosted mode, via per-tenant routing in cloud mode (decision #11). |
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

Baseline layout for the redesign roadmap (to be confirmed/refined in the OC-1590 design review). Every roadmap story lands as a *package inside an existing module* — never a new module, never a changed dependency direction. Additions driven by decisions #10–12 are marked *(new)*.

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
├── tenant                      tenant catalog + system DB, dynamic per-tenant Mongo routing (new — decision #11)
├── workflow · connector · invoker   management CRUD; invoker XML parser/importer (improved schema, XML retained)
├── subscription                execution quota: total usage from Service Portal (cloud) or license file (self-hosted); current usage stored encoded in Mongo; browse/build always free — every execution enforced at the Dispatcher (test runs and debugger sessions count too)
├── trigger                     Quartz, webhook, manual, test
├── dispatch                    Execution Dispatcher over the transport SPI
├── variables                   Global Params store + resolution
├── monitoring                  execution state API, live streams, log aggregation
├── notification                NotificationChannel SPI: email, Slack, …
├── admin                       service/worker status, queued jobs (new)
├── audit                       append-only store + query API (new)
├── settings                    SettingKey registry, SettingsService, GET/PATCH /settings (new — decision #13)
└── config                      opencelium.* bootstrap properties, secret provider impl

io.opencelium.worker            wiring only — deliberately grows nothing
```

Open placement calls for the OC-1590 design review: (a) where transport *implementations* live — `local` naturally sits in `execution`; `amqp` in `execution` or its own package, but never in `core`, or workers can't use it; (b) per-feature Mongo repositories inside each core feature package (preferred — keeps each seam self-contained) vs. a shared persistence package. Neither call moves anything on the roadmap.

## Deployment shapes & transport SPI

Both shapes are first-class and must always keep working. The shape is **derived at runtime, not a build variant and not a config property** — one `./gradlew build`, same commit, same version, produces the monolith jar alone or both jars.

Dispatch goes through a **pluggable transport SPI**:

| Shape | Artifacts | Transport |
|---|---|---|
| **Monolith** — small installs | `oc-app.jar` (`:core:bootJar`) | `local` — selected automatically when no broker is configured; the Dispatcher calls the executor in-process. Zero infrastructure beyond MongoDB. |
| **Distributed** — scaled installs | `oc-app.jar` + N × `oc-worker.jar` | `amqp` — selected automatically when a broker connection is configured (a DB-backed runtime setting, set via UI/API, effective without restart); the Dispatcher publishes **self-contained jobs** (workflow snapshot + credentials + global params, encrypted on the broker) to a message broker (RabbitMQ / any AMQP); workers consume with at-least-once delivery and publish results/logs as events. |
| **Custom** — special environments | same as distributed | `custom` — a user-provided transport SPI implementation on the classpath overrides detection (Kafka, SQS, …). |

**Transport detection rules** (decision #4): a configured-but-unreachable broker is a **visible dispatch error, never a silent fallback** to `local` (broker health is surfaced in the admin status API); switching to `amqp` at runtime affects new dispatches only — in-flight local executions finish in-process; test runs always execute on `local`; workers take their broker address from env/yml (they have no DB or UI).

There is deliberately **no HTTP dispatch path** — workers are consumers, not servers. Live-run streams reach the frontend as broker events → core's Log Aggregation → WebSocket Gateway; WebSocket sessions live only in core, never fed from worker memory.

**Worker → core event vocabulary.** One pipe, several event families: execution **results**, **log** streams, execution **state transitions** (feeding the state machine of decision #12, including checkpoints), **variable updates** (Global Params written mid-execution — workers never write MongoDB, so variable writes travel as events and core persists them), **worker heartbeat/registration** (dynamic membership; feeds the admin status view), and **audit events**. New needs extend this vocabulary — they never open a side channel around the transport.

**Tenancy is orthogonal to deployment shape.** Either shape runs single-tenant (self-hosted) or multi-tenant (cloud — decision #11). The tenant ID travels inside job messages and events, so transports and workers need no tenant awareness of their own.

This is why the engine is a library: the same execution code compiles into both apps, so local and brokered execution cannot drift apart — provided execution features are added to `execution` (transport SPI contracts to `common`), never directly to `core` or `worker`.

## Configuration & secrets placement

Where a configuration value lives is a rule, not a per-story choice (decision #13). There are exactly two places:

| Place | What goes there | Changing it |
|---|---|---|
| **yml file** (`opencelium.*`) | Only what the app needs to start, before any database is reachable | Edit the file + restart |
| **Database** (`settings` collection / secret store) | Everything else | `PATCH /settings` — applies at runtime, no restart |

The legacy `/application-config` yml-editor endpoint is dropped, not ported — its reason to exist (runtime changes to a file-based config) disappears when settings live in the database.

### The three placement questions

Ask them in order for every new value; the first "yes" decides.

**1. Does the app need it before it can reach a database?** → **Bootstrap value (yml).** Two namespaces, one rule: **a property Spring already owns keeps its standard name** (`server.port`, `spring.mongodb.uri`) and is never mirrored into our namespace; **`opencelium.*` holds only values Spring has no concept of** — deployment mode, master-key reference — as a typed record in `core.config` (`OpenCeliumProperties`), bound and validated by hand rather than through `@ConfigurationProperties` so that every failure names its property. All bootstrap values are validated fail-fast: a bad or missing required value stops the app at startup with an error naming the property. Cloud mode changes what the URI points at, not the rule — there the yml URI is core's **system database** (tenant catalog, decision #11); per-tenant connections are resolved from the catalog at runtime, never from yml. The list is deliberately tiny and should almost never grow.

**2. Does the value grant access to something?** (passwords, API tokens, private keys, broker credentials) → **Secret.** Stored in the database, but encrypted through the `SecretProvider` SPI and held everywhere else as an opaque `SecretRef`. Two extra rules: plaintext exists only in memory, only at the moment of use (never cached); and **no API ever returns a stored secret value** — write endpoints accept a value and return a ref, read endpoints return masked output. A lost credential is re-entered, not recovered.

**3. Neither?** → **Runtime setting (DB).** Declared in the code-side `SettingKey` registry (name, type, default value, validation rule), stored in the `settings` collection as **overrides only**: no document means the code default applies, so a fresh install has an empty collection and a complete configuration, and "reset to default" is a delete. Read only through `SettingsService`; changed through `GET/PATCH /settings`; unknown keys and invalid values are rejected. Components subscribe to `SettingsService` change notifications instead of reading a value once at startup — that is what makes changes effective without restart.

### Examples

| Value | Question | Placement |
|---|---|---|
| HTTP port | 1 | yml — `server.port` (standard Spring) |
| MongoDB URI (self-hosted: *the* database; cloud: the system database) | 1 | yml — `spring.mongodb.uri` (standard Spring; see the Mongo rules below) |
| Deployment mode | 1 | yml — `opencelium.deployment-mode`: `self` (self-hosted, default) or `saas` (what this document calls cloud mode) |
| Master encryption key | 1 | **Environment variable.** The yml at most *names* the env variable or key file — the key value itself is never in the file. No default, no fallback: a missing key stops the app at startup. |
| Broker hostname / port / vhost | 3 | Runtime setting |
| Broker password | 2 | Secret (`SecretRef` inside the broker setting) |
| Connector credentials | 2 | Secret |
| Default LOOP parallelism | 3 | Runtime setting |

**Mongo rules.** The property is standard; client creation is not: Boot's Mongo auto-configuration is excluded, and one tenant-aware factory (decision #11) builds every `MongoClient` in both modes — in self-hosted it reads `spring.mongodb.uri` (via Spring's own `MongoProperties` binding; this is the Spring Boot 4 name — Boot 3's `spring.data.mongodb.uri` is no longer bound and is silently ignored, verified empirically), in cloud the same property points at the **system database** and per-tenant clients are built from the tenant catalog — one client per cluster, never per tenant. Three startup guards: **the URI is never silently defaulted** — self-hosted falls back to the *documented* `mongodb://localhost:27017/opencelium` with a loud log line naming it (zero-config first run, OC-1613 Task 2), while cloud **requires it explicitly** — if absent, the app stops naming the property; **the yml-configured server is pinged eagerly at startup in both modes** — the Mongo driver is lazy by design (an unreachable server otherwise surfaces as a `MongoTimeoutException` on first use, ~30s in), so an unreachable DB stops the app with a clear error instead; **the yml client is system-scope only** — in cloud mode no tenant document is ever read or written through it; tenant data flows exclusively through the catalog-driven per-cluster clients, so a non-tenant-aware client can never sneak in.

The broker connection is the flagship compound case: its plain parts are a question-3 setting, its password a question-2 secret referenced from it — and it is what makes the derived transport (#4) settable from the UI without restart. There is **no transport property** (an earlier `opencelium.execution.transport` draft was removed deliberately): the transport is derived from the broker setting, so the configured broker and the selected transport can never contradict each other. Workers are the one exception to database settings — they have no DB and no UI, so they take their broker address from env/yml.

### Adding a new value

1. Answer the three questions; the first "yes" decides the placement.
2. **Bootstrap** → first check whether Spring already owns a property for it: if yes, use the standard name and only add our validation; if no, extend the `opencelium.*` properties class in `core.config` with its validation constraint. Either way, add one comment line to the sample yml. Expect pushback in review — this list is not supposed to grow.
3. **Runtime setting** → declare a `SettingKey` (name, type, default, validation) in `core.settings`; read it via `SettingsService`; subscribe to change notifications if the component must react at runtime.
4. **Secret** → store via `SecretProvider`, hold a `SecretRef` (`common.secret`); never a plaintext field on a `@Document` class.

ArchUnit rules turn this into build failures (no `@Value`; crypto only inside the secrets package; no plaintext secret-named fields on `@Document` classes; the `settings` collection read only via `SettingsService`) — the placement rule is checked by the build, not by review.

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
2. **Deployment shape is decided at runtime, not a build variant.** Two different builds would mean testing two artifacts forever; one artifact whose transport is derived at runtime (#4) is one artifact to trust.
3. **Engine as a library, apps as thin hosts.** Guarantees local and brokered execution share one implementation, and forces engine logic to be unit-testable without booting Spring.
4. **Dispatch via pluggable transport SPI: `local | amqp | custom`.** *(Revised 2026-09-02 per PM's v2 design — supersedes the earlier "HTTP first, queue later" decision. Revised 2026-09-16: transport is derived, not configured.)* Monolith mode uses the in-process `local` transport (zero infrastructure); distributed mode requires a message broker (`amqp`, at-least-once delivery); the SPI lets users plug Kafka/SQS/etc. There is no HTTP dispatch path — workers are consumers, not servers. The transport is **never set by a property** (an earlier `opencelium.execution.transport` draft was removed deliberately): no broker configured → `local`; broker connection configured (a runtime setting per #13, so it can be set from the UI without restart) → `amqp`; a custom SPI implementation on the classpath overrides detection. A configured-but-unreachable broker fails dispatch visibly — never a silent fallback to `local`.
5. **Tests mirror the production package** (no `unit.*`/`slice.*` subpackages, unlike legacy OC 5.1): keeps package-private access; module boundaries plus `*Test`/`*IT` suffixes already route tests.
6. **Ground-up rewrite.** Legacy OpenCelium code is reference material for analysis only — its concepts inform design; its code and patterns are never ported. Domain vocabulary (invoker, connector) is deliberately retained — see the glossary.
7. **Platform-wide access control: RBAC + per-resource ACLs.** *(PM requirement.)*

   *Why:* role checks alone are too coarse — "share this one workflow with that one colleague" must not require inventing a new role.

   - **RBAC** (component × action) is the coarse layer; **every resource** — workflow, connector, invoker, data-store entry — additionally carries an ACL (subject → permission → this resource).
   - **First increment (v2 design): per-workflow ACLs**, stored on each workflow document, enforced in Mongo queries, REST, and WebSocket topic subscriptions; execution logs inherit the workflow's ACL.
   - Enforcement lives in core (API access) **and** in the execution engine (parameter/credential resolution at runtime, identically on both transports) — so the ACL model itself belongs in `common`.

   *(Detailed design — permission set, extension to other resources, secret encryption, log masking — is on the [pending design-session agenda](#pending-design-sessions) below.)*
8. **Promise-based (dataflow) execution.**

   *Why:* a DAG with fan-out, AND-joins and parallel loops maps naturally onto promises; blocking waits would pin threads and serialize branches, and a reactive framework would infect every signature.

   - Two-phase node lifecycle: **prepare** (eager: parse the node, pre-evaluate what OCEL can already resolve, identify missing inputs, subscribe to the promises that will deliver them — then move on) and **execute** (triggered: when the last input promise resolves, placeholders are replaced with real data and the request fires).
   - Graph semantics: fan-out = multiple subscribers on one promise; AND-join = `allOf` over branch promises; parallel LOOP = a bounded batch of iteration promises.
   - Implementation: promises (`CompletableFuture`-style) for coordination, **virtual threads** for the actual work (sequential-looking code inside a node), **structured concurrency** for branch scopes so a failed branch cancels its racing siblings — no reactive framework.
   - Eagerness is bounded: LOOP iterations are prepared lazily in windows, never all 50k up front.
   - Observability: every promise/node carries execution ID + node ID into logs and events, and node state (prepared / waiting-on / running / done / failed) is inspectable — this feeds the live WebSocket stream.
   - Testability: engine tests must be able to resolve promises in controlled (including adversarial) orders — executor and clock are always injected.
9. **Workers are fully isolated and stateless.** No MongoDB access, no persistent state: the job message is self-contained (workflow snapshot + credentials + global params, encrypted on the broker) and everything leaves the worker as events; local log files are a transient spool. This keeps workers disposable and horizontally scalable, and prevents core-only infrastructure from leaking into the engine.
10. **Authentication is a pluggable strategy, separate from authorization.**

    *Why:* auth methods vary by deployment mode while authorization (#7) must stay identical — so neither side may know the other's internals.

    - Authentication produces a principal (identity, tenant, group/claim mappings); authorization (RBAC + ACLs, #7) consumes it. No permission logic in security filters.
    - Which strategies are active is deployment-mode configuration, like the transport switch (#2).
    - **Self-hosted:** local credentials, LDAP, optionally OIDC (core is the OIDC client; users and tenant live in core's DB). External IdPs map claims → users/groups with JIT provisioning; 2FA/TOTP layers on the local strategy.
    - **Cloud:** the external **Service Portal** only, reachable over two paths that end in the same portal-issued token: (a) the OIDC redirect flow — the portal authenticates the user itself (portal-native credentials) or brokers external IdPs (Google, Apple, ...), which methods it offers being portal-side configuration invisible to core; (b) a direct credential login — the user enters username/password in the OpenCelium login form and core exchanges them at the portal's authentication API for the access token and claims (portal-native accounts only; brokered-IdP users must use the redirect flow). In cloud the portal owns claim mapping and provisioning.
    - Core trusts only the portal issuer and keeps a non-authoritative shadow user row. The portal's token/login response supplies the **tenant identifier only** — a login says who the user is, it is never the key that unlocks database connections; connection resolution is #11's tenant catalog.

    *(Added 2026-09-08. The portal's OIDC-provider role was confirmed by PM on 2026-09-21 — the portal needs changes to support it; the OC-1585 week-1 spike verifies the endpoints and payload.)*
11. **Tenant context is first-class; in cloud mode, OpenCelium core keeps a system database with a tenant catalog.**

    *Why:* connection data delivered at login broke scheduled executions — after a core restart with nobody logged in, no tenant's data was reachable. Core must be able to resolve any tenant's database at any time, by itself.

    - **The Service Portal owns the business** *(SaaS vocabulary: the control plane)*: tenant identity and lifecycle (onboarding, suspension, deletion), subscriptions, and placement — and it is the only component with **admin access to the shared MongoDB clusters**: provisioning creates the tenant's scoped DB user (rights on that one database only) and hands `(cluster, dbName, credential)` to OpenCelium core. Core never holds cluster-admin rights — it can reach the tenants it serves but cannot create, drop, or enumerate databases.
    - **Core's system database** (`spring.mongodb.uri` in cloud mode) = the internal map: the **tenant catalog** (tenant ID → cluster, database name, status, connection credential as a **system-scope** `SecretRef` — encrypted under the root key or a system DEK, never under the tenant's own DEK: that DEK lives inside the tenant's database (#14), so it would be circular) plus core-owned data (analytics/usage, per-tenant quotas and flags, the tenant-admin view, scheduling state).
    - The catalog is a **projection, never the source of truth**: fed by portal provisioning events/API and periodically reconciled — never populated from user logins.
    - **Tenant databases live on shared MongoDB clusters** *(SaaS vocabulary: the data plane)*; isolation is by database name (database-per-tenant, optionally a per-tenant DB user), not by physical server. Core keeps **one `MongoClient` per cluster, never per tenant** (a client carries connection pools and monitor threads); premium/isolated tiers are just a different placement in the catalog.
    - **Logins carry identity only** (tenant ID as a token claim); scheduled and triggered executions resolve tenants purely from the catalog, so they run with nobody logged in and survive restarts.
    - **Tenant-keyed is every story's definition of done**: the tenant ID lives in the principal, on every persisted document (workflows, connectors, executions, variables, ACL entries, audit records), inside the self-contained job message, and on every event a worker publishes — the engine and transports stay tenant-agnostic while isolation is enforced at the persistence and API layers.
    - **Self-hosted** = the same code path with a single static tenant: one MongoDB connection at startup, today's behavior unchanged.

    *(Added 2026-09-08; revised 2026-09-22 — replaced "cloud bootstraps without a database / connection data arrives with portal login", which left scheduled executions unable to reach tenant data.)*
12. **Executions are checkpointable; the promise graph is reconstructible.** *(Extends #8.)*

    *Why:* workflows must wait days on a human response without pinning threads, survive core/worker restarts, and resume on a *different* worker — impossible with in-memory promises held indefinitely.

    - Above #8's node states sits an execution-level state machine: `RUNNING → PAUSED | WAITING | COMPLETED | FAILED` (`PAUSED` = debugger breakpoint, `WAITING` = Wait-for-Human). Transitions and checkpoints flow as events to core, which persists them in Mongo at node-completion granularity.
    - Resume = rebuild the promise graph from a checkpoint: completed nodes' promises start pre-resolved, and execution continues from the frontier. A resume job message carries the checkpoint (#9's self-contained rule extended to resumes), so any worker can pick it up.
    - The **Execution Debugger** is the same mechanism driven interactively on the `local` transport: a breakpoint pauses, the UI inspects node state and variables via #8's inspectability, and *continue* resolves the held promise.

    *(Added 2026-09-08. Checkpoint/resume design lives inside the Execution Debugger story (OC-1599), landing before its consumers — restart recovery (OC-1601) and the Wait-for-Human node (OC-1603); the execution refactor (OC-1588) leaves the checkpoint seam open in the state machine rather than designing it.)*
13. **Config lives in two places: the yml file or the database.**

    *Why:* the legacy platform kept everything in `application.yml`, so any change meant shell access and a restart — the `/application-config` yml-editor endpoint was a workaround (dropped, not ported).

    - **The yml file holds only what the app needs to start** — a deliberately tiny list, restart to change. Standard Spring properties keep their standard names; `opencelium.*` holds only values Spring has no concept of.
    - **Everything else is a database setting**, changeable at runtime via `GET/PATCH /settings`.
    - **Credentials are database values with two extra rules:** encrypted via the `SecretProvider` SPI (default Mongo store, AES-256-GCM, per-secret IV, key versioning; the master key is read from an **environment variable** — never from the yml file, no default, no fallback), and never readable back through any API (domain documents hold a `SecretRef`, decrypted only at the moment of use, never cached in plaintext).
    - Enforced by ArchUnit rules, so the convention fails the build instead of relying on review.

    *(Added 2026-09-16 — OC-1584. The operational rule — the three placement questions, examples, and how to add a new value — is in **Configuration & secrets placement** above.)*
14. **Envelope encryption: one root key per installation, one DEK per tenant.** *(Extends #13's secret store; see [OC-1584-key-structure.svg](security/OC-1584-key-structure.svg), source: [OC-1584-key-structure.mermaid](security/OC-1584-key-structure.mermaid).)*

    *Why:* per-tenant blast radius; tenant offboarding as crypto-shredding (deleting the wrapped DEK makes that tenant's secrets permanently unrecoverable, in backups too); cheap root-key rotation (re-wrap N small DEKs, never re-encrypt the secrets).

    - Two key layers: a single **root key** (self-hosted name: master key) per installation encrypts only DEKs; one **data-encryption key (DEK)** per tenant encrypts that tenant's secrets (AES-256-GCM, fresh IV per secret).
    - The root key lives **outside every database** — resolved at startup in fixed precedence: `OC_MASTER_KEY` env variable → key file named in yml → auto-generated file in the data directory (`SecureRandom`, 32 bytes, `chmod 600`, logged with a backup warning). Never derived from a passphrase, never a hard-coded default; both env and file set at once is a startup error.
    - **Auto-generation happens on fresh installs only**: if the database already holds a wrapped DEK but no key resolves — or the resolved key fails to unwrap it (GCM authentication makes a wrong key a clean, detectable failure) — the app **stops at startup** naming the problem, never generates a replacement silently. Secrets under a lost key are locked, not corrupted; recovery is "restore the original key" or an explicit secrets reset.
    - DEKs are **app-managed only** — generated at a tenant's first stored secret, stored wrapped in that tenant's own database, unwrapped in core memory at use; no UI, API, or config exposes them.
    - Self-hosted is the same code path with exactly one tenant.
    - The root key never leaves core — not to workers, the broker, or any job message.

    *(Added 2026-09-22 — OC-1584 planning. Root-key rotation procedure is a follow-up ticket; the key-version fields land now. Worker-side key material for encrypted job payloads is on the [pending design-session agenda](#pending-design-sessions) below, leaning: a separate transport key.)*

### Pending design sessions

One session, several intertwined topics (agenda formerly embedded in #7):

- **ACL detailed design:** permission set, extension beyond workflows, secret encryption, log masking.
- **Job message contract:** codec seam — JSON first, protobuf as a possible transport codec, never the domain model.
- **Payload encryption & key distribution:** worker-side key material for encrypted job payloads (leaning: separate transport key, see #14).
- **Idempotent job consumption** under at-least-once delivery.
- **Raw-request-node credential hygiene:** reference the guarded store via OCEL instead of plaintext tokens in headers; note a raw node has no connector ACL to inherit.
- **Per-LOOP parallelism defaults.**
