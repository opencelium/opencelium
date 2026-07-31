# Dashboard Widget Endpoints

How the two dashboard data widgets work: **Executions & failures** (time-series
line chart) and **Top workflows** (ranked table).

Both are read-only aggregations over the MariaDB `execution` table. They live on
the existing `WidgetController` (base path `/widget`) and are served by
`WidgetDataService` / `WidgetDataServiceImp`.

> Note: these endpoints return widget **data**. They are unrelated to the
> `/widget` CRUD endpoints (`/widget`, `/widget/all`, `/widget/{id}`), which
> manage the widget **catalog** (`Widget` entity: name/icon/tooltip) and
> per-user layout (`WidgetSetting`).

---

## 1. Executions & failures

Executions and failures per day for the last *N* days, **inclusive of today**.
Powers the line chart.

```
GET /widget/executions-timeline?days=7
```

| Param  | Type | Required | Default | Notes                                  |
|--------|------|----------|---------|----------------------------------------|
| `days` | int  | no       | `7`     | Size of the trailing window. Must be ≥ 1. |

**Behaviour**
- The window is `[today − (days − 1), today]` → exactly `days` daily buckets.
- The window end is always **now** — there is no `to`/end parameter by design
  (a dashboard always shows data up to the present).
- Days with **no executions are zero-filled** (`executions: 0, failures: 0`), so
  the response always contains exactly `days` points in ascending date order.
- A failure is an `execution` row with `status = 'F'`.

**Response** `200 OK` — `ExecutionsTimelineDTO`

```json
{
  "points": [
    { "date": "2026-06-15", "dayOfWeek": "MONDAY",    "executions": 124, "failures": 18 },
    { "date": "2026-06-16", "dayOfWeek": "TUESDAY",   "executions": 165, "failures": 22 },
    { "date": "2026-06-17", "dayOfWeek": "WEDNESDAY", "executions": 0,   "failures": 0  }
  ]
}
```

| Field       | Type   | Meaning                                            |
|-------------|--------|----------------------------------------------------|
| `date`      | string | ISO-8601 date (`yyyy-MM-dd`) of the bucket.        |
| `dayOfWeek` | enum   | `MONDAY` … `SUNDAY`. Convenience for axis labels.  |
| `executions`| number | Total executions started that day.                 |
| `failures`  | number | Executions that day with `status = 'F'`.           |

---

## 2. Top workflows

The connections with the most executions **of all time**, with their failure
rate. Powers the table.

```
GET /widget/top-workflows?limit=5
```

| Param   | Type | Required | Default | Notes                          |
|---------|------|----------|---------|--------------------------------|
| `limit` | int  | no       | `5`     | Max rows returned. Must be ≥ 1. |

**Behaviour**
- **All-time** aggregation — there is intentionally **no** time window here
  (unlike the timeline). The table reflects lifetime totals.
- A "workflow" is one MariaDB `Connection`, labelled by `connection.title`.
- Ranked by execution count descending, capped at `limit`.
- `failureRate` is a **percentage** (0–100), rounded to one decimal place.
- Executions not linked to a connection (no scheduler join) are **excluded** —
  see the design notes.

**Response** `200 OK` — `TopWorkflowsDTO`

```json
{
  "rows": [
    { "connectionId": 12, "title": "SAP_to_Salesforce",   "executions": 1245, "failureRate": 4.2 },
    { "connectionId": 8,  "title": "Shopify_to_Postgres", "executions": 982,  "failureRate": 1.1 }
  ]
}
```

| Field         | Type   | Meaning                                          |
|---------------|--------|--------------------------------------------------|
| `connectionId`| number | MariaDB `connection.id`.                         |
| `title`       | string | `connection.title` — the workflow name.          |
| `executions`  | number | All-time execution count for that connection.    |
| `failureRate` | number | Percentage of executions with `status = 'F'`, one decimal (e.g. `4.2`). |

---

## Errors

| Status | When                                                              |
|--------|-------------------------------------------------------------------|
| `400`  | `days` < 1 or `limit` < 1. Body is the standard `ErrorResource`.  |
| `401`  | Unauthenticated (handled by the global security filter chain).    |
| `500`  | Unexpected server error (`ErrorResource`).                        |

Validation is an explicit guard in the controller that throws
`ResponseStatusException(BAD_REQUEST, …)`. A non-numeric value (e.g.
`?days=abc`) is a type-conversion failure, also `400`.

## Security

Both endpoints sit behind the standard authenticated security chain
(`AuthenticationFilter` → `AuthorizationFilter`), consistent with the sibling
`/widget` endpoints. They expose **aggregate counts only** — no credentials,
tokens, or `master-password`-encrypted values — so no extra masking applies.

## Data source & SQL

Both queries are native (`@Query(nativeQuery = true)`) in
`ExecutionRepository`. The join path for Top workflows is:

```
execution.scheduler_id → scheduler.id
scheduler.connection_id → connection.id (title)
```

The timeline query reads `execution` alone (no joins): `start_time`, `status`.

## Quick reference (curl)

```bash
# Last 7 days (default)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:9090/widget/executions-timeline"

# Last 30 days
curl -H "Authorization: Bearer <token>" \
  "http://localhost:9090/widget/executions-timeline?days=30"

# Top 5 workflows, all-time (default)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:9090/widget/top-workflows"

# Top 10
curl -H "Authorization: Bearer <token>" \
  "http://localhost:9090/widget/top-workflows?limit=10"
```

Swagger UI: `http://localhost:9090/docs`.
