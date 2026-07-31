# Dashboard Widget Endpoints — Design Notes & Trade-offs

Context and decisions behind the **Executions & failures** and **Top workflows**
widget endpoints, recorded so future changes are made with the original
reasoning in view. See [dashboard-widget-endpoints.md](dashboard-widget-endpoints.md)
for the API contract itself.

---

## Decisions made

### D1. Two endpoints, not one parameterised endpoint
**Chosen:** separate `GET /widget/executions-timeline` and `GET /widget/top-workflows`.
**Rejected:** a single `GET /widget/data?type=…` returning a polymorphic envelope.

| | Two endpoints (chosen) | One `?type=` endpoint |
|---|---|---|
| Response typing | Concrete DTO per route; accurate Swagger | Envelope with `Object data`; Swagger can't describe both shapes |
| Parameters | Each takes only what it needs (`days` vs `limit`) | Forces optional params that are ignored for some types |
| Dispatch | Plain methods | `switch(type)` + enum + converter + 400-on-unknown |
| Shared code saved | Only a route declaration | — |

The widgets share almost no query logic, and their parameters genuinely differ
(`days` is meaningless for an all-time table; `limit` is meaningless for the
timeline). Concrete endpoints are more honest about both.

**If this changes:** should a generic dashboard renderer later need to fetch
arbitrary widgets uniformly by name, add a *thin* `GET /widget/data?type=`
facade that delegates to the same `WidgetDataService` methods. Start concrete,
add the facade only when a second consumer needs it — nothing is lost.

### D2. Data from MariaDB `execution`, not MongoDB `log_data`
The `execution` table already carries everything both widgets need
(`start_time`, `status` `'S'`/`'F'`, and — via `scheduler` — the connection).
It is the same source `ExecutionService.getStats()` already aggregates.
MongoDB `log_data` holds per-phase execution detail (`PhaseStatus`,
`createdAt`) but at finer granularity than needed and on the other datastore.
Single-source keeps it a simple SQL aggregation with **no cross-DB work**.

### D3. Timeline is windowed; Top workflows is all-time
The line chart is inherently a trailing window (`days`, default 7 — matches the
Mon–Sun mockup). Top workflows shows lifetime totals (the mockup's 1,245 / 982…),
so it takes **no** time filter. This asymmetry is deliberate and is the main
reason against a unified endpoint (D1).

### D4. No `to`/end parameter — window always ends "now"
A dashboard shows data up to the present, so only the window **start** is
configurable. Modelled as relative `days` (not an absolute `startDate`) because
dashboards think in "last N days," and — importantly — `from`/`to` are loaded
terms in this domain (the **from/to connectors** of a connection). Reusing them
as date-range params would confuse API users. Hence `days`.

### D5. Server-side zero-fill of the timeline
The SQL `GROUP BY DATE(start_time)` returns only days that had executions.
`WidgetDataServiceImp` walks every day in the window and fills gaps with
`0/0`, so the response always has exactly `days` points in order. The frontend
never has to reason about missing days.

### D6. A "workflow" = one `Connection` (by `title`)
Confirmed against the mockup: the `X_to_Y` row labels are `connection.title`.
Aggregation keys off `connection.id` / `title` via `execution → scheduler →
connection`.

**5.0 model note:** the connection *body* changed in 5.0 (single merged
`fromConnector` = DEFAULT connector, `connectorId = -1`, `toConnector` null,
all methods carried under it). That lives in the MongoDB `ConnectionMng` body
and does **not** affect these widgets — they read only the MariaDB
`Connection`/`Execution`/`Scheduler` tables, whose meaning is unchanged in 5.0.
If a future widget needs a **per-connector** breakdown, *that* is where the
`-1`/merged-`from` detail starts to matter (read the Mongo body or
`MethodConnectorMng.connectorId`), not the `execution` table.

### D7. Validation via `ResponseStatusException`
`days`/`limit` < 1 throw `ResponseStatusException(BAD_REQUEST)`. Spring 6's
`ResponseEntityExceptionHandler` resolves it to a real 400 ahead of the app's
catch-all `Exception → 500` handler (verified by the slice test). No bean
validation / `@Validated` plumbing was needed for two simple guards.

---

## Known limitations & trade-offs (future work)

### L1. Top workflows excludes executions with no connection
The Top-workflows query `JOIN`s `execution → scheduler → connection`. Executions
without a scheduler/connection (e.g. certain manual or webhook-triggered runs,
if any) are **dropped** from this widget. Counts here may be lower than the
global total in `ExecutionService.getStats()`. Confirm this matches product
intent; switch to a `LEFT JOIN` with a synthetic "(no connection)" bucket if not.

### L2. Day bucketing uses the database server timezone
`DATE(start_time)` buckets by the **DB server's** timezone, not UTC or the
caller's. On a non-UTC deployment, "day" boundaries follow the DB. If
multi-timezone correctness is needed, pass an offset/zone and apply
`CONVERT_TZ` in the query.

### L3. No caching
Each call hits the DB. `ExecutionService.getStats()` caches its all-time result
in a `ConcurrentHashMap` and evicts on `Execution` save — the Top-workflows
all-time query is a good candidate for the same pattern if dashboard load
becomes heavy. The timeline is windowed and cheaper; cache only if measured.
Deferred until there's evidence it's needed.

### L4. MariaDB-specific SQL — repository IT pending
The native queries use MariaDB idioms (`DATE()`, `LIMIT :limit`,
`SUM(CASE WHEN status='F' …)`) that **do not run on the H2 slice DB**. A
`@DataJpaTest` slice is therefore *not* suitable; correctness of the SQL must be
covered by a Testcontainers MariaDB `*IT` in `src/integrationTest/`.

**Status: not yet written** (requires a Docker environment). Until it exists,
the SQL itself is unverified end-to-end; the service shaping and controller
contract are covered by unit + slice tests. This is the most important
follow-up.

### L5. Widget catalog registration not done
The `widget` catalog table is seeded via SQL `INSERT` in
`db/changelog/mysql/changelog.sql` (`CONNECTION_OVERVIEW`, `CURRENT_SCHEDULER`,
`MONITORING_BOARDS`). If the frontend lists/places dashboard widgets from this
catalog, the two new widgets need rows there too (name, icon,
`tooltipTranslationKey`) via a new Liquibase changeset. **Not added** —
pending confirmation of whether these data endpoints are catalog-driven.

### L6. No pagination on Top workflows
Capped by `limit` only; there is no offset/paging. Fine for a "top N" widget; a
full ranked, paged list would need a different endpoint.

---

## Test coverage

| Layer | File | Runs on |
|-------|------|---------|
| Service (zero-fill, rounding, mapping, edge cases) | `unit/…/WidgetDataServiceImpTest` | `./gradlew test` (no Docker) |
| Controller (200 bodies, default params, 400 guards) | `slice/controller/WidgetControllerTest` | `./gradlew test` (no Docker) |
| Repository SQL (the two native queries) | — **not yet written** | `./gradlew integrationTest` (Docker) — see L4 |

12 tests passing. The repository IT (L4) is the remaining gap.
