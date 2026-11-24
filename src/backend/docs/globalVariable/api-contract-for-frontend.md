# Global Variables — API Contract for Frontend

Nov 23, 2026 · @Bob Mustaev

The backend exposes global variables under `/global-variable` as plain JSON, following `/aggregator`. This is the agreed contract from [Global Variables — Spec](https://claude.ai/artifact/Y1SkReqUk3z7Fs5wA85gwm); built so far (2026-11-23): constants with secrets; mutable variables that users create, edit and reset, and that runs of the owner workflow write through a method's globalWrites or set() in a JavaScript enhancement, one run at a time; and script variables in JavaScript, Python 3 and Ruby, each imported and called by an enhancement of its own language. Section 12 walks through one example end to end, and section 13 gives TypeScript types for every request and response.

## Contents

- [1. Conventions](#1-conventions)
- [2. Endpoints and screens](#2-endpoints-and-screens)
- [3. Enums](#3-enums)
- [4. Variables: list, detail, create, update, delete](#4-variables-list-detail-create-update-delete)
  - [List — `GET /all?page=0&size=20&sort=name,asc&search=&kind=`](#list--get-allpage0size20sortnameascsearchkind)
  - [Detail — `GET /{id}`](#detail--get-id)
  - [Create and update — `POST /` and `PUT /{id}`](#create-and-update--post--and-put-id)
  - [Name check — `GET /unique/{name}`](#name-check--get-uniquename)
  - [Delete — `DELETE /{id}`](#delete--delete-id)
- [5. Sharing — `GET /{id}/permissions` and `PUT /{id}/permissions`](#5-sharing--get-idpermissions-and-put-idpermissions)
- [6. Live values — `GET /values?ids=7,12` or `?workflowId=42`](#6-live-values--get-valuesids712-or-workflowid42)
- [7. Impact, used by, change log, restore](#7-impact-used-by-change-log-restore)
  - [Impact preview — `POST /{id}/impact`](#impact-preview--post-idimpact)
  - [Used by — `GET /{id}/usage`](#used-by--get-idusage)
  - [Change log — `GET /{id}/changes`](#change-log--get-idchanges)
  - [Restore — `POST /{id}/restore/{changeId}`](#restore--post-idrestorechangeid)
  - [Reset — `POST /{id}/reset`](#reset--post-idreset)
- [8. Picker and script test run](#8-picker-and-script-test-run)
  - [Picker — `GET /picker?connectionId=42`](#picker--get-pickerconnectionid42)
  - [Script check and test run — `POST /validate-script`](#script-check-and-test-run--post-validate-script)
- [9. Errors on variable endpoints](#9-errors-on-variable-endpoints)
  - [400 — validation](#400--validation)
  - [409 — conflict](#409--conflict)
- [10. Changes to existing APIs](#10-changes-to-existing-apis)
  - [Workflow JSON](#workflow-json)
  - [Workflow, connector and notification save errors](#workflow-connector-and-notification-save-errors)
  - [Starting a busy workflow](#starting-a-busy-workflow)
    - [When a webhook is refused](#when-a-webhook-is-refused)
  - [Run log](#run-log)
- [11. Open points](#11-open-points)
- [12. Worked example: one workflow from first variable to delete](#12-worked-example-one-workflow-from-first-variable-to-delete)
  - [Step 1 — API slice and list page](#step-1--api-slice-and-list-page)
  - [Step 2 — Create a constant and a secret](#step-2--create-a-constant-and-a-secret)
  - [Step 3 — Create the mutable cursor](#step-3--create-the-mutable-cursor)
  - [Step 4 — Use the variables in the workflow](#step-4--use-the-variables-in-the-workflow)
  - [Step 5 — Watch the run live](#step-5--watch-the-run-live)
  - [Step 6 — Change log and reset](#step-6--change-log-and-reset)
  - [Step 7 — Edit with impact preview and version](#step-7--edit-with-impact-preview-and-version)
  - [Step 8 — Add a script variable and call it](#step-8--add-a-script-variable-and-call-it)
  - [Step 9 — Delete](#step-9--delete)
- [13. TypeScript types](#13-typescript-types)

## 1. Conventions

All endpoints sit under one base path and follow the existing controllers, e.g. `AggregatorController`.

- **Base path:** `/global-variable`, next to `/aggregator`. Plain JSON DTOs, no HATEOAS links.
- **Component permission:** the frontend already knows the user's `GLOBAL_VARIABLE` rights (`READ`, `CREATE`, `UPDATE`, `DELETE`). Show the sidebar entry "Global variables" under Configurations only with this permission.
- **Per-variable rights:** each variable carries `myPermissions` (`VIEW_USE`, `EDIT`, `DELETE`). Use it to hide buttons.
- **Success:** 200 with the DTO; 204 for delete.
- **Errors:** the existing `ErrorResource` (`timestamp`, `status`, `error`, `message`, `path`). Validation and conflict errors add code-carrying `violations`, like `JumpValidationErrorResource`. See section 9.
- **Paging:** the existing `PaginatedDto` (`content`, `currentPage`, `totalPages`, `totalItems`). Query params `page` (from 0), `size`, `sort` (e.g. `name,asc`).
- **Name check:** the existing `ResultDTO<Boolean>` → `{"result": true}`.
- **Values are real JSON** in requests and responses: a map is sent as a map, not as a string.
- **Times** are ISO-8601 UTC strings. **Ids** are numbers.
- **Reference syntax** in any text field: `{{global.name}}`, with optional path (`{{global.tenants[0].id}}`). `\{{` in front of a whole reference, `\{{global.name}}`, makes it literal text that keeps its `{{`.

## 2. Endpoints and screens

Sixteen new endpoints, all under `/global-variable`. "Needs" is the component right (upper case) or the per-variable right (`code`).

A row that names a per-variable right also needs the component right: READ to read, UPDATE to change, restore or reset, DELETE to delete, and UPDATE or DELETE for the impact preview. The permissions rows need READ and UPDATE besides being the owner user or an admin.

| Method and path | Purpose | Needs |
| --- | --- | --- |
| `GET /all` | Paged list with `search` and `kind` filters; only variables the user may view | READ |
| `GET /{id}` | One variable | `VIEW_USE` |
| `GET /unique/{name}` | Name availability check | READ |
| `POST /` | Create; the caller becomes the owner user | CREATE |
| `PUT /{id}` | Update; body carries `version`, 409 if stale | `EDIT` |
| `DELETE /{id}` | Delete; 409 with usages if still used | `DELETE` |
| `GET /{id}/permissions` | Who may use, edit, delete | owner user or admin |
| `PUT /{id}/permissions` | Replace those grants | owner user or admin |
| `GET /values?ids=` or `?workflowId=` | Current values for polling, with `ETag` | `VIEW_USE` per variable |
| `GET /{id}/usage` | "Used by" list | `VIEW_USE` |
| `GET /{id}/changes` | Change log, newest first | `VIEW_USE` |
| `POST /{id}/restore/{changeId}` | Restore a value or script version | `EDIT` |
| `POST /{id}/reset` | Set a mutable variable's current value back to its initial value | `EDIT` |
| `POST /{id}/impact` | What a proposed change or delete would block or affect | `EDIT` or `DELETE` |
| `POST /validate-script` | Analyse, syntax-check and test-run a script without saving | CREATE or UPDATE |
| `GET /picker` | Light list for the reference picker, enhancement editor and the globalWrites editor; one of connectionId, categoryId, connectorId or schedulerId (section 8) | READ |

**Which screen calls what**

| Screen | Calls |
| --- | --- |
| List page | `GET /all`, then `GET /values` every 5 s for the visible rows |
| Detail page | `GET /{id}`, `GET /{id}/usage`, `GET /{id}/changes`, `POST /{id}/restore/{changeId}`, `GET /values` every 5 s |
| Create and edit form | `GET /unique/{name}`, `POST /`, `PUT /{id}`, `POST /{id}/impact`, `POST /validate-script` |
| Sharing section | `GET /{id}/permissions`, `PUT /{id}/permissions`, the existing user list |
| Delete dialog | `POST /{id}/impact` with `{"delete": true}`, then `DELETE /{id}` |
| Reference picker, enhancement editor, globalWrites editor | `GET /picker?connectionId=` (`?categoryId=` for an unsaved workflow) |
| Connector and notification editors | `GET /picker?connectorId=` or `?schedulerId=`, then the existing saves with the new errors |
| Workflow editor save | Existing workflow endpoints, with the new error format |
| Run log | Existing execution log endpoint, with the new fields (section 10) |

## 3. Enums

Every enum the UI must render or send. Fields marked "mutable only" are `null` for other kinds.

| Field | Values |
| --- | --- |
| `kind` | `CONSTANT`, `MUTABLE`, `SCRIPT` |
| `script.language` | `js`, `python3`, `ruby` |
| `scope.type` | `ALL`, `CATEGORIES`, `WORKFLOWS` |
| `busyPolicy` (mutable only) | `QUEUE` (default), `REFUSE` |
| `permission` / `myPermissions` | `VIEW_USE`, `EDIT`, `DELETE` |
| `usage.sourceType` | `WORKFLOW`, `CONNECTOR`, `NOTIFICATION` |
| `usage.elementType` | `METHOD`, `OPERATOR`, `ENHANCEMENT` |
| `usage.access` | `READ`, `WRITE`, `IMPORT` (an enhancement imports a script variable) |
| `change.changeType` | `CREATE`, `VALUE`, `CONFIG`, `PERMISSIONS`, `RESTORE`, `DELETE`, `RESET`, `RUN_WRITE` |
| `change.actor.type` / `updatedBy.type` | `USER`, `WORKFLOW` (only on a `RUN_WRITE` change: the workflow whose run wrote) |
| `change.result` | `SAVED`, `REJECTED` |

UI proposal for kind at a glance: constant = lock icon, gray; mutable = refresh icon, amber; script = code icon, violet.

## 4. Variables: list, detail, create, update, delete

### List — `GET /all?page=0&size=20&sort=name,asc&search=&kind=`

```json
{
  "content": [
    {
      "id": 12,
      "name": "lastSync",
      "kind": "MUTABLE",
      "description": "Cursor for the VMware sync",
      "secret": false,
      "valuePreview": "\"2026-11-17T22:00:00Z\"",
      "language": null,
      "parameterCount": null,
      "scopeType": "CATEGORIES",
      "usageCount": 3,
      "myPermissions": ["VIEW_USE", "EDIT"],
      "version": 4,
      "updatedAt": "2026-11-16T09:12:00Z",
      "updatedBy": { "type": "USER", "id": 1, "name": "admin" },
      "beingUpdatedBy": { "workflowId": 42, "executionId": 511, "startedAt": "2026-11-19T08:00:00Z" }
    }
  ],
  "currentPage": 0, "totalPages": 1, "totalItems": 1
}
```

- `sort` takes `name`, `kind`, `createdAt` or `updatedAt`; any other property falls back to `name`. `size` is at most 100. `search` matches the name or the description.
- `valuePreview` = the value as JSON text, first 100 characters; the current value for a mutable variable; `null` for secrets and scripts.
- `language` and `parameterCount` are set for scripts only.
- `updatedAt` / `updatedBy` are the last change a user saved (`updatedBy.type` is always `USER` here); a run's writes don't move them. `GET /values` tells who set the current value.
- `beingUpdatedBy` is non-null while an owner run is writing the variable — show a "Being updated by …" badge.

### Detail — `GET /{id}`

Constant or mutable variable:

```json
{
  "id": 7,
  "name": "tenants",
  "kind": "CONSTANT",
  "description": "Tenants to sync",
  "value": [ { "id": "acme", "region": "eu" }, { "id": "globex", "region": "us" } ],
  "secret": false,
  "hasValue": true,
  "script": null,
  "scope": { "type": "CATEGORIES", "categories": [ { "id": 3, "name": "CMDB sync" } ], "workflows": [] },
  "ownerUser": { "id": 1, "name": "admin" },
  "myPermissions": ["VIEW_USE", "EDIT", "DELETE"],
  "mutable": null,
  "version": 4,
  "createdAt": "2026-11-02T09:00:00Z",
  "createdBy": { "type": "USER", "id": 1, "name": "admin" },
  "updatedAt": "2026-11-16T09:12:00Z",
  "updatedBy": { "type": "USER", "id": 1, "name": "admin" }
}
```

For a secret, `value` is always `null` and `hasValue` says whether one is set.

Mutable variable: `value` is the initial value, and `mutable` holds the rest (`null` for the other kinds):

```json
"mutable": {
  "currentValue": "2026-11-17T22:00:00Z",
  "revision": 6,
  "setAt": "2026-11-17T22:04:11Z",
  "setBy": null,
  "setByExecutionId": 511,
  "busyPolicy": "QUEUE",
  "ownerWorkflow": { "id": 42, "title": "VMware → i-doit" }
}
```

- `currentValue` is what runs read; `value` stays the initial value a reset goes back to.
- `revision` goes up on every new current value. `version` does not move, so an open edit form stays valid.
- `setBy` is the user who created or reset the variable; it is `null`, with `setByExecutionId` set, when a run wrote it.
- `ownerWorkflow` is the one workflow whose runs may write the variable. It is `null` once that workflow is deleted, and the next save must name a new one.

Script variable (only the fields that differ):

```json
{
  "name": "formatDate",
  "kind": "SCRIPT",
  "description": "Formats an ISO date",
  "value": null,
  "script": {
    "language": "js",
    "code": "var d = new Date(date);\n…\nreturn text;",
    "parameters": [
      { "name": "date", "description": "ISO date text", "required": true, "default": null },
      { "name": "pattern", "description": "Output pattern", "required": false, "default": "dd.MM.yyyy" }
    ]
  }
}
```

A script uses only its parameters: its code may not call `ref()` or `set()` (`SCRIPT_NOT_PURE`). `required` is false when `default` is set. Sending `required: true` together with a default answers 400 `PARAMETER_INVALID`. Section 10 shows how an enhancement imports and calls it.

### Create and update — `POST /` and `PUT /{id}`

```json
{
  "name": "lastSync",
  "kind": "MUTABLE",
  "description": "Cursor for the VMware sync",
  "value": "2026-11-01T00:00:00Z",
  "secret": false,
  "script": null,
  "scope": { "type": "ALL", "categoryIds": [], "workflowIds": [] },
  "busyPolicy": "QUEUE",
  "ownerWorkflowId": 42,
  "version": 4
}
```

- The request sends `scope.categoryIds` / `workflowIds`; the detail response returns `scope.categories` / `workflows` as `{id, name}` objects.
- `scope` is always sent: the backend has no default and answers 400 `SCOPE_REQUIRED` without it. The create form preselects `ALL` (All workflows).
- `version` is required on `PUT`, ignored on `POST`.
- `kind` and `script.language` can't change after creation — lock them in the edit form.
- Mutable: `value` is the initial value. Saving it leaves the current value alone; `POST /{id}/reset` copies it over.
- Mutable: `ownerWorkflowId` is required: the one workflow whose runs may write the variable. It must exist and lie in the scope. `busyPolicy` is `QUEUE` (default) or `REFUSE`. On `PUT`, leaving either out keeps the saved one. A mutable variable can't be a secret.
- Secret on `PUT`: leave `value` out (or `null`) to keep it; send a value to replace it.
- `SCRIPT`: send `script` (`language`, `code`, `parameters`) and leave `value` out.
- Response: the full detail DTO.

### Name check — `GET /unique/{name}`

Returns `{"result": true}` when the name is free.

### Delete — `DELETE /{id}`

204 on success. 409 `IN_USE` with `blocking` usages if still referenced — call `POST /{id}/impact` with `{"delete": true}` first to show what blocks it.

## 5. Sharing — `GET /{id}/permissions` and `PUT /{id}/permissions`

Only the owner user or an admin may call these; show the Sharing section only to them.

`GET` response:

```json
{
  "ownerUser": { "id": 1, "name": "admin" },
  "grants": [
    { "user": { "id": 5, "name": "jdoe" }, "permissions": ["VIEW_USE"] },
    { "user": { "id": 9, "name": "msmith" }, "permissions": ["VIEW_USE", "EDIT"] }
  ],
  "version": 6
}
```

`PUT` body — replaces all grants, logged as a `PERMISSIONS` change:

```json
{ "grants": [ { "userId": 5, "permissions": ["VIEW_USE"] } ], "version": 6 }
```

The user list for the picker comes from the existing user endpoint.

## 6. Live values — `GET /values?ids=7,12` or `?workflowId=42`

Poll every 5 s while the list or detail page is visible; send the last `ETag` as `If-None-Match` and expect 304 with no body when nothing changed.

```json
[
  { "id": 12, "version": 4, "revision": 128, "value": "2026-11-17T22:00:00Z", "updatedAt": "2026-11-17T22:04:11Z",
    "updatedBy": null,
    "beingUpdatedBy": { "workflowId": 42, "executionId": 511, "startedAt": "2026-11-19T08:00:00Z" } },
  { "id": 7, "version": 4, "revision": 0, "value": [ { "id": "acme", "region": "eu" } ], "updatedAt": "2026-11-16T09:12:00Z",
    "updatedBy": { "type": "USER", "id": 1, "name": "admin" }, "beingUpdatedBy": null }
]
```

- Give either `ids` or `workflowId`, never both. Both answer 400 `VALUES_TARGET_AMBIGUOUS` on field `workflowId`; neither answers 400 `IDS_REQUIRED` on field `ids`.
- `ids`: up to 100 per call (more answers 400 `TOO_MANY_IDS`).
- `workflowId`: every constant and mutable variable **in scope** of that saved workflow, the same set the picker lists for it (`GET /picker?connectionId=`). That includes variables open to all workflows that the workflow never references. No 100 limit. An unknown workflow answers 404 `CONNECTION_NOT_FOUND`. Use it where a screen shows the variables of one workflow, such as the workflow editor.
- For a mutable variable, `value` is the current value, and `updatedAt` / `updatedBy` tell when and by which user it was set (`updatedBy` is `null` when a run wrote it). `revision` counts new current values and is part of the `ETag`. `beingUpdatedBy` is set for a mutable variable while a run of its owner workflow goes, as {workflowId, executionId, startedAt}, and null otherwise. executionId can be null for a moment before the run's execution exists. A run that starts or ends changes the ETag, so the next poll shows or hides the badge.
- Script variables have no stored value. Listed in `ids`, they are refused with 400 `SCRIPT_HAS_NO_VALUE`, so don't include them. With `workflowId` they are simply left out.
- Secrets come back with `value: null`.
- Variables the user may not view are silently left out.

## 7. Impact, used by, change log, restore

### Impact preview — `POST /{id}/impact`

Body: the `PUT` body the user is about to save, or `{"delete": true}`. Call it before saving or deleting so the form can warn.

```json
{
  "blocking": [
    { "sourceType": "WORKFLOW", "sourceId": 51, "sourceTitle": "Ivanti → Slack", "elementType": "ENHANCEMENT", "elementLabel": "Build title", "reason": "PARAMETER_BREAKING", "parameter": "pattern" }
  ],
  "warnings": [
    { "sourceType": "WORKFLOW", "sourceId": 42, "sourceTitle": "VMware → i-doit", "elementType": "ENHANCEMENT", "elementLabel": "Build title", "reason": "CALLS_IN_CODE_NOT_CHECKED" }
  ]
}
```

Non-empty `blocking` means the save will be refused with 409. Reasons:

| Reason | Meaning |
| --- | --- |
| `OUT_OF_SCOPE` | The new scope drops a workflow that uses the variable |
| `IN_USE` | Delete or rename while still used |
| `PARAMETER_BREAKING` | Script parameter change breaks callers |
| `CALLS_IN_CODE_NOT_CHECKED` | The calls in the code of an enhancement that imports the script can't be checked (warning) |

### Used by — `GET /{id}/usage`

```json
[
  { "sourceType": "WORKFLOW", "sourceId": 42, "sourceTitle": "VMware → i-doit", "elementType": "ENHANCEMENT", "elementLabel": "Build title",
    "color": "#FFCF00", "index": "0_1", "field": "enhancement.args", "access": "IMPORT" },
  { "sourceType": "WORKFLOW", "sourceId": 42, "sourceTitle": "VMware → i-doit", "elementType": "METHOD", "elementLabel": "getChangedObjects",
    "color": "#ababab", "index": "0", "field": "globalWrites", "access": "WRITE" },
  { "sourceType": "CONNECTOR", "sourceId": 3, "sourceTitle": "i-doit", "field": "url", "access": "READ" },
  { "sourceType": "NOTIFICATION", "sourceId": 17, "sourceTitle": "Sync report", "field": "en.body", "access": "READ" }
]
```

`color` and `index` identify the element. A "Used by" link opens the workflow editor on it with `/workflow/update/{workflowId}?element={index}`, for example `/workflow/update/42?element=1_2`. The link uses `index` because an operator has no `color`. If no element has that index any more, the editor opens the workflow without a selection. The `element` parameter is new frontend work. A connector or notification usage has no `index` and gets no such parameter.

### Change log — `GET /{id}/changes`

Query params: `page` (from 0) and `size` (default 20, at most 100). Newest first.

```json
{
  "content": [
    {
      "id": 904,
      "changeType": "RUN_WRITE",
      "versionFrom": 3,
      "versionTo": 3,
      "oldValue": "2026-11-16T22:00:00Z",
      "newValue": "2026-11-17T22:00:00Z",
      "changedFields": null,
      "actor": { "type": "WORKFLOW", "id": 42, "name": "VMware → i-doit" },
      "executionId": 511,
      "writeCount": 312,
      "result": "SAVED",
      "reason": null,
      "changedAt": "2026-11-17T22:04:11Z",
      "restorable": false
    },
    {
      "id": 903,
      "changeType": "VALUE",
      "versionFrom": 2,
      "versionTo": 3,
      "oldValue": "2026-01-01T00:00:00Z",
      "newValue": "2026-11-01T00:00:00Z",
      "changedFields": null,
      "actor": { "type": "USER", "id": 12, "name": "Jane Doe" },
      "executionId": null,
      "writeCount": null,
      "result": "SAVED",
      "reason": null,
      "changedAt": "2026-11-12T09:30:00Z",
      "restorable": true
    }
  ],
  "currentPage": 0, "totalPages": 7, "totalItems": 128
}
```

- `CONFIG` and `PERMISSIONS` changes: `oldValue` / `newValue` are `null`; `changedFields` lists them, e.g. `[{"field": "scope", "old": {…}, "new": {…}}]`.
- Secret values appear as `"••••"`.
- `restorable` is true for saved value and script changes — show "Restore" only then.

**Run writes.** A run of the owner workflow stores each value at once. When the run ends, in any way, the change log gets one `RUN_WRITE` entry per variable the run wrote, however often it wrote. `oldValue` is the current value before the run's first write, `newValue` the value of its last write, `writeCount` the number of writes and `changedAt` the time of the last one. `actor` is the workflow, with `type` `WORKFLOW`, its id and its title (`name` is `null` once the workflow is deleted), and `executionId` is the execution. The version does not move, and the entry is never restorable. A test run logs nothing. The newest 200 `RUN_WRITE` entries per variable are kept (`opencelium.global-variable.change-log.max-run-entries`). On every other entry `executionId` and `writeCount` are `null`. There are no filters by actor, workflow or date, and no `source` provenance of a write.

### Restore — `POST /{id}/restore/{changeId}`

Body ` {"version":  ``3``}`. Response: the full detail DTO. 409 if the version is stale or, for scripts, if the old parameters would break current callers. It sets the value the entry saved: for a mutable variable that is its initial value, which a reset then makes the current value, and for a script the whole script.

### Reset — `POST /{id}/reset`

No body; needs `EDIT`. Sets the current value of a mutable variable back to its initial value and logs a `RESET` change whose `oldValue` is the replaced current value. `version` stays, `revision` goes up. Response: the full detail DTO. 400 `NOT_MUTABLE` for a constant or a script.

## 8. Picker and script test run

### Picker — `GET /picker?connectionId=42`

All variables in the workflow's scope that the user may use. Unpaged and light; group by `kind` in the UI. Inserting a constant or a mutable variable writes `{{global.name}}`. A script can be chosen only in the enhancement editor, where it is added to `args` as the next `//var VAR_n = {{global.name}};`.

```json
[
  { "name": "idoitUrl", "kind": "CONSTANT", "description": "i-doit JSON-RPC endpoint", "secret": false,
    "valuePreview": "\"https://cmdb.example\"", "language": null, "parameters": null,
    "ownerWorkflow": null, "writable": false },
  { "name": "lastSync", "kind": "MUTABLE", "description": "Cursor for the VMware sync", "secret": false,
    "valuePreview": "\"2026-11-17T22:00:00Z\"", "language": null, "parameters": null,
    "ownerWorkflow": { "id": 42, "title": "VMware → i-doit" }, "writable": true },
  { "name": "formatDate", "kind": "SCRIPT", "description": "Formats an ISO date", "secret": false,
    "valuePreview": null, "language": "js",
    "parameters": [ { "name": "date", "description": "ISO date text", "required": true, "default": null },
                    { "name": "pattern", "description": "Output pattern", "required": false, "default": "dd.MM.yyyy" } ],
    "ownerWorkflow": null, "writable": false }
]
```

| Context | Query |
| --- | --- |
| Saved workflow | `?connectionId=` |
| Workflow not saved yet | `?categoryId=` |
| Connector editor | `?connectorId=` — returns `ALL`-scope variables only |
| Notification editor | `?schedulerId=` — uses the schedule's workflow |
| Nothing given | `ALL`-scope variables only |

Give at most one of these: two or more answer 400 `PICKER_TARGET_AMBIGUOUS`. An unknown workflow or schedule answers 404.

`writable` is true when the picker's `connectionId` is the variable's owner workflow. With `categoryId`, `connectorId`, `schedulerId` or nothing it is always false: a workflow that is not saved yet owns nothing, and connectors and notifications only read. The globalWrites editor and `set()` offer only writable entries. `ownerWorkflow` names the owner of a mutable variable, so an entry another workflow owns can show "Owned by VMware → i-doit". It is `null` for the other kinds, and once the owner workflow is deleted.

### Script check and test run — `POST /validate-script`

Request:

```json
{
  "language": "js",
  "code": "var d = new Date(date); … return text;",
  "parameters": [ { "name": "date", "required": true }, { "name": "pattern", "required": false, "default": "dd.MM.yyyy" } ],
  "testArguments": ["2026-11-17T22:00:00Z", "dd.MM"]
}
```

Response:

```json
{
  "valid": true,
  "result": "17.11",
  "resultJsonType": "string",
  "durationMs": 3,
  "error": null
}
```

- `name` is optional and only names the script in messages. A script reads nothing but its parameters, so `testArguments` is all a test call needs.
- `testArguments` are positional, as in a call from enhancement code; one left out takes its default. On failure: `"valid": false` and `"error": {"code": "SCRIPT_SYNTAX", "message": "Expected ; but found text", "line": 3, "column": 14}` — show it at its line in the code editor. `line` and `column` are set for syntax errors only.
- The call answers 200 whether the script passes or not; `valid` tells which. Error codes: `SCRIPT_SYNTAX`, `SCRIPT_RUNTIME`, `SCRIPT_TIMEOUT`, `NO_RETURN_VALUE`, `SCRIPT_NOT_PURE` (the code calls `ref()` or `set()`), `PARAMETER_INVALID`, `SCRIPT_REQUIRED` (no code), `LANGUAGE_NOT_SUPPORTED`, `MISSING_ARGUMENT` (a required parameter got no test argument), `VALIDATION_UNAVAILABLE` (Python 2, which can't be saved either), `SCRIPT_ENGINE_UNAVAILABLE` (Python 3 or Ruby while the polyglot service is off, down or does not answer).

## 9. Errors on variable endpoints

400 carries per-field `violations`; 409 carries a top-level `code` and always a `blocking` list: the usages that block for `IN_USE`, `SCOPE_NARROWING` and `PARAMETER_BREAKING`, and `[]` for `VERSION_CONFLICT` and `BUSY`. 403 and 404 use the plain `ErrorResource`.

### 400 — validation

```json
{
  "timestamp": "2026-11-19T10:15:00Z", "status": 400, "error": "GLOBAL_VARIABLE_INVALID",
  "message": "Name 'lastSync' is already taken", "path": "/global-variable",
  "violations": [ { "field": "name", "code": "NAME_TAKEN", "message": "Name 'lastSync' is already taken" } ]
}
```

`field` matches the request field, so each message can be shown on its form field: `name`, `value`, `secret`, `script.code`, `script.parameters[1].name`, `scope`, `busyPolicy`, `ownerWorkflowId`.

Codes: `NAME_TAKEN`, `NAME_INVALID`, `KIND_REQUIRED`, `KIND_CHANGE_NOT_ALLOWED`, `DESCRIPTION_TOO_LONG`, `VALUE_TOO_LARGE`, `VERSION_REQUIRED` (a PUT or restore without `version`), `SCOPE_REQUIRED`, `SCOPE_INVALID` (no category or workflow chosen, or one that does not exist), `GRANT_INVALID` (on the permissions PUT: no user, no permission, the owner, a user twice or unknown), `SECRET_NOT_ALLOWED` (a mutable or script variable), `SECRET_REMOVAL_NEEDS_VALUE` (turning a secret off without a new value), `OWNER_WORKFLOW_REQUIRED`, `OWNER_WORKFLOW_INVALID` (missing or outside the scope), `MUTABLE_ONLY` (`busyPolicy` or `ownerWorkflowId` on another kind), `NOT_MUTABLE` (reset of another kind), `NOT_RESTORABLE` (restore of a secret's change or of a change with no value), `SCRIPT_HAS_NO_VALUE` (a script variable sent with a `value`), `SCRIPT_REQUIRED` (a script variable without `script`), `SCRIPT_ONLY` (`script` on another kind), `LANGUAGE_NOT_SUPPORTED`, `LANGUAGE_CHANGE_NOT_ALLOWED`, `SCRIPT_SYNTAX`, `NO_RETURN_VALUE` (JavaScript only: the code has no `return`), `SCRIPT_NOT_PURE` (the code calls `ref()` or `set()`), `PARAMETER_INVALID` (a parameter name that is not an identifier, appears twice or is a reserved word, a description over 512 characters, or a required parameter that has a default), `SCRIPT_ENGINE_UNAVAILABLE` (a Python 3 or Ruby script while the polyglot service is off, down or does not answer). The query codes of `/values` and `/picker` are in sections 6 and 8. A body that is not valid JSON gets the plain 400 `ErrorResource`.

Limits behind `VALUE_TOO_LARGE`: 64 KB per value, 256 KB per script (configurable).

### 409 — conflict

```json
{
  "status": 409, "error": "GLOBAL_VARIABLE_CONFLICT", "code": "VERSION_CONFLICT",
  "message": "Changed by admin at 2026-11-19T10:14:02Z, reload to see the new value",
  "currentVersion": 5,
  "blocking": []
}
```

| Code | UI action |
| --- | --- |
| `VERSION_CONFLICT` | Someone else saved first — reload and retry |
| `IN_USE` | Delete or rename blocked — list `blocking` usages |
| `SCOPE_NARROWING` | New scope drops a user — list `blocking` usages |
| `PARAMETER_BREAKING` | Script parameter change breaks callers — list them |
| `BUSY` | A start of a busy workflow is refused (section 10) — show the message; empty `blocking` |

`blocking` entries have the same shape as in the impact preview (section 7).

## 10. Changes to existing APIs

No existing endpoint changes its URL; workflow, connector and notification JSON gain new tokens and fields, saves gain new errors, and the run log gains fields.

### Workflow JSON

Value references are plain text tokens inside existing string fields:

```json
{ "request": { "endpoint": "{{global.idoitUrl}}/api", "body": { "fields": { "filter": { "changed_since": "{{global.lastSync}}" }, "tenants": "{{global.tenants}}" } } } }
```

When a field holds only the reference (`tenants` above), the backend sends it as real JSON (here an array). A loop over a global array puts `{{global.tenants}}` in the loop operator's expression, where a method response reference goes today.

**Writes from a method** — `globalWrites` on the method maps each mutable variable it writes, as `global.name` without braces, to the value to write: a reference, or JSON text:

```json
{
  "color": "#ababab",
  "name": "createVm",
  "request": { "endpoint": "{{global.idoitUrl}}/api/objects" },
  "globalWrites": {
    "global.lastSync": "#ababab.(response).body.$.updatedAt",
    "global.lastId":   "{%#ababab.(response).body.$.items[-1].id%}",
    "global.mode":     "\"delta\""
  }
}
```

- The writes run in order right after the method has responded, on every loop pass too. The rest of the run reads the new value, so a later method may overwrite it.
- Only the variable's owner workflow may write it. A test run writes to its own copy only; the stored value is not touched.
- A target with braces, a path or other text is refused on save with `INVALID_WRITE_TARGET`.

**Script variable in an enhancement** — there is no field call and no `globalScript`. The enhancement imports the script in its `args` like any other reference, as the next `//var VAR_n = {{global.name}};`, and its code calls `VAR_n(...)` as a function:

```json
{
  "enhancement": {
    "language": "js",
    "args": "//var RESULT_VAR = #FFCF00.(request).body.$.title; //var VAR_0 = #00A3FF.(response).body.$.created; //var VAR_1 = {{global.formatDate}}; //var VAR_2 = {{global.tenantPrefix}};",
    "script": "RESULT_VAR = VAR_2 + '-' + VAR_1(VAR_0, 'dd.MM');"
  }
}
```

- `VAR_1` is a function because `formatDate` is a script; `VAR_0` and `VAR_2` are values. With `VAR_0 = "2026-11-17T22:00:00Z"` and `VAR_2 = "ACME"`, `RESULT_VAR` is `"ACME-17.11"`.
- A parameter left out takes its default: `VAR_1(VAR_0)` gives `"17.11.2026"`. A call without a required parameter fails the step at run time; saving can't check calls in code.
- The enhancement must be written in the script's own language: a `js` script goes into a `js` enhancement, a `python3` script into a `python3` one, a `ruby` script into a `ruby` one. Another language, or none, is refused on save with `IMPORT_LANGUAGE_MISMATCH`. A script variable used anywhere else is refused on save with `SCRIPT_NOT_CALLABLE`: a text field, `ref("{{global.formatDate}}")` in enhancement code, a value a method writes, a path (args included), or only part of an arg's value. Both checks run on workflow, connector, notification and notification template saves.

**Enhancement reading and writing variables** — `args` take `{{global.name}}` like any other reference. Code reads a value with `ref("{{global.name}}")` in any language and, in JavaScript only, writes a mutable variable with `set("{{global.name}}", value)`:

```json
{
  "enhancement": {
    "language": "js",
    "args": "//var RESULT_VAR = #C77E7E.(request).body.$.['@odata.id']; //var VAR_0 = #FFCFB5.(response).body.$.items; //var VAR_1 = {{global.name}}",
    "script": "var max = ref('{{global.limits.maxPerPage}}'); set(\"{{global.lastSync}}\", VAR_0[VAR_0.length - 1].at); RESULT_VAR = VAR_1 + '/' + max;"
  }
}
```

- `ref()` gets the value as a native string, number, list or map; it reads the value from before the script started.
- `set()` writes once the script has finished, in order, with the same owner and test-run rules as `globalWrites`. A script that fails writes nothing. Its target is `{{global.name}}` with braces and without a path.

**Other new fields**

- On a method: `globalWrites` (above). Data aggregators stay as they are and do not write global variables.
- The busy policy is set on the mutable variable (`busyPolicy`), not on the workflow. A workflow that uses a mutable variable with `REFUSE` refuses a second run while one is going.

### Workflow, connector and notification save errors

400 on the existing saves, shaped like `JumpValidationErrorResource`:

```json
{
  "status": 400, "error": "GLOBAL_REFERENCE_INVALID",
  "message": "Global variable 'formatDate' is a script and has no value to read; import it in the args of an enhancement in its language as //var VAR_n = {{global.formatDate}}; without a path",
  "violations": [
    { "code": "SCRIPT_NOT_CALLABLE", "message": "Global variable 'formatDate' is a script and has no value to read; import it in the args of an enhancement in its language as //var VAR_n = {{global.formatDate}}; without a path", "variable": "formatDate", "ref": "{{global.formatDate}}", "color": "#FFCF00", "index": "0_1", "field": "body.title" },
    { "code": "IMPORT_LANGUAGE_MISMATCH", "message": "Script variable 'formatDate' is written in JavaScript and cannot be imported into a 'python3' enhancement", "variable": "formatDate", "ref": "{{global.formatDate}}", "color": "#C77E7E", "index": "0_2", "field": "enhancement.args" }
  ]
}
```

- Workflow violations carry `color` + `index` to highlight the element. Connector and notification violations carry `field` instead.
- Codes: `UNKNOWN_VARIABLE`, `OUT_OF_SCOPE`, `NO_USE_PERMISSION`, `INVALID_WRITE_TARGET` (a `globalWrites` target that is not `global.name`, or a `set()` target that is not `{{global.name}}`), `NOT_MUTABLE` (a write to a constant or script), `NOT_OWNER` (a write by a workflow that does not own the variable, or by one saved for the first time), `SCRIPT_NOT_CALLABLE` (a script variable anywhere but the whole value of an enhancement arg, or with a path), `IMPORT_LANGUAGE_MISMATCH` (a script imported into an enhancement of another language than the script's, or of none). Connectors add `SCOPE_NOT_ALL`. A write is reported on field `globalWrites` or `enhancement.script`.
- Category update and moving a workflow to another category run the same scope check.

### Starting a busy workflow

A workflow that owns or references a mutable variable runs one execution at a time. A second start follows the busy policy of those variables: with `QUEUE` it waits in a first-in, first-out queue of the workflow and runs when the current run ends; one variable with `REFUSE` is enough to refuse it. The queue holds at most 100 starts, each waiting at most 60 minutes (both configurable); a start past either limit is refused. Test runs are never held: they write their own copy.

- Manual start (`GET /scheduler/execute/{schedulerId}`, and start all, `PUT /scheduler/startAll`): a start that would be refused answers 409 at once with code `BUSY`, below. A start that can wait is accepted as today.
- Scheduled start: nothing answers. A refused start, or one dropped from the queue after 60 minutes, is saved as a failed execution that starts and ends at once, so it shows in the history as the last failure. Its log holds the reason only with debug mode on, or for a run started with a support file. No notification is sent.

  A schedule keeps at most one cron fire waiting. A newer fire of the same schedule is skipped, and the waiting fire takes its time, so the 60 minutes count from the latest fire; skipped fires never fill the queue. When the run that held the workflow ends, each schedule with skipped fires gets one failed execution and one 409 on the websocket channel, for example `Cron fires of schedule 9 skipped while execution 511 of the workflow ran: 3. The first one was skipped with: A cron fire of schedule 9 already waits in the workflow's queue`.
- A refusal made when the run is about to start also goes to the workflow's websocket channel as an `ErrorResource` with status 409. That covers every refused scheduled start, and a manual or webhook start refused after its 200. A manual start that gets 409 on the call is not sent there. Webhook starts that get it are sent together, once per schedule, when the run that held the workflow ends.
- Webhook (`GET` and `POST /webhook/execute/{token}`): same as a manual start, with or without query parameters or body. A start that would be refused answers 409 with code `BUSY`; a start that can wait answers 200 and waits in the queue. A workflow without a mutable variable accepts every call, also while it runs.

```json
{ "timestamp": "2026-11-23T10:15:00Z", "status": 409, "error": "GLOBAL_VARIABLE_CONFLICT", "code": "BUSY",
  "message": "Global variable 'lastSync' is busy: execution 511 of the workflow is running and its busy policy is REFUSE",
  "path": "/scheduler/execute/7", "currentVersion": 3, "blocking": [] }
```

`currentVersion` is the version of the variable that refused, and 0 when the queue was full. The answer always carries an empty `blocking` list.

#### When a webhook is refused

Only a workflow that owns or references a mutable variable refuses a webhook. Any other workflow accepts every call, also while it runs.

| When | Condition | Caller gets | Recorded |
| --- | --- | --- | --- |
| On the call | The workflow is busy and one of its mutable variables says `REFUSE` | 409 `BUSY` | Once per run: failed execution, websocket |
| On the call | The workflow is busy and 100 starts already wait in its queue | 409 `BUSY` | Once per run: failed execution, websocket |
| Before the run | Another start took the workflow first, and `REFUSE` or a full queue applies | 200, already sent | Failed execution, websocket |
| Before the run | The start waited in the queue more than 60 minutes | 200, already sent | Failed execution, websocket |
| Before the run | The start leaving the queue could not be fired | 200, already sent | Failed execution, websocket |

Webhook starts refused on the call are counted per schedule, because a busy workflow may be called many times. When the run that held the workflow ends, each schedule with refused starts gets one failed execution, and one `ErrorResource` with status 409 goes to the workflow's websocket channel. Its message names how many starts were refused and why the first one was, for example `Webhook starts of schedule 7 refused while execution 511 of the workflow ran: 40. The first one was refused with: Global variable 'lastSync' is busy: execution 511 of the workflow is running and its busy policy is REFUSE`. As for a refused scheduled start, the execution's log holds that reason only with debug mode on, and no notification is sent. A refused manual start is not recorded: the user sees the 409.

Busy means a run holds the workflow, or the workflow is held for up to 10 minutes for a start leaving its queue. While the webhook's own schedule runs, Quartz holds the new start outside the queue until that run ends, so the queue limits do not count it meanwhile; then it meets the workflow like any other start (table above). The check on the call applies all the same: under `REFUSE` or with a full queue it gets the 409.

An unknown token, webhook or schedule answers 500 (`TOKEN_NOT_FOUND`, `WEBHOOK_NOT_FOUND`, `SCHEDULER_NOT_FOUND`) and starts nothing.

### Run log

The existing execution log response gets one field, `globalSnapshot`: every variable in the workflow's scope, used or not, with the version and value the run started with. It is filled only with debug mode on, like the rest of the execution log. For a script variable, value is its definition.

```json
{
  "globalSnapshot": [
    { "name": "idoitUrl", "version": 4, "value": "https://cmdb.example" },
    { "name": "idoitApiKey", "version": 2, "value": "••••" },
    { "name": "tenants", "version": 7, "valueOmitted": true, "valueBytes": 180000 }
  ]
}
```

- Secrets are masked as `"••••"`.
- A value too large for the log is left out: `valueOmitted` is true and `valueBytes` gives its size. Both fields are absent otherwise.
- Not built: `globalCalls`, `globalCallSummary`, `globalWrites` and `lockWaitMs`. Script calls and run writes are not in the run log so far.
- No new execution statuses: a refused or dropped start is a failed execution (above).

## 11. Open points

These points were open; all of them are decided now and are kept as a record.

- [x] **Calling a script variable:** decided. Enhancement `args` import it as `//var VAR_n = {{global.name}};` and the code calls `VAR_n(...)`; there is no field call and no `globalScript` (section 10).
- [x] **Deep link:** decided, a "Used by" link is `/workflow/update/{workflowId}?element={index}` (section 7). The frontend adds the `element` parameter to the workflow editor.
- [x] **Webhook and the busy policy:** decided, every webhook call follows the busy policy like a manual start (section 10). A start that waits answers 200 like one that runs, with no body and no queue position. The position is not known when the answer is sent, and a 202 could make a sender retry and queue a second run.
- [x] **Refused webhook starts:** decided and built. Webhook starts refused with 409 `BUSY` on the call are recorded once per busy run and schedule: when the run ends, one failed execution names how many were refused, and it goes to the workflow's websocket channel (section 10). A refused manual start stays unrecorded, because the user sees the 409.
- [x] **UI naming:** decided, the UI says "Global variables" and "workflow", not "Global parameters" or "connection". This is display text only: API paths, field names and backend messages already use these words and stay as they are.
- [x] **Default scope** for a new variable: decided, the create form preselects All workflows (`ALL`). The API has no default: `scope` is always sent, and a request without it answers 400 `SCOPE_REQUIRED` (section 4).
- [x] **Sharing with groups:** decided for this release, grants are per user (admins hold every permission); groups may come later.
- [x] **Secrets on mutable variables** (e.g. a refreshed access token): decided, a mutable variable cannot be a secret.
- [x] **Run writes in the change log:** decided and built. A run's writes are logged as one `RUN_WRITE` entry per run and variable, with the workflow as actor (section 7).
- [x] **Python 2:** `POST /validate-script` answers `VALIDATION_UNAVAILABLE` for Python 2 scripts only. Python 3 and Ruby scripts are checked and tested like JavaScript. Saving a Python 2 script variable is refused with `LANGUAGE_NOT_SUPPORTED`, so the language picker offers `js`, `python3` and `ruby` only.

## 12. Worked example: one workflow from first variable to delete

This walks one workflow through every screen in the order a user meets them. **VMware → i-doit** (workflow 42, category 3 "CMDB sync") reads an endpoint and an API key and keeps a sync cursor between runs. Bodies are trimmed to the fields that matter; the ids are the ones the backend would hand back.

### Step 1 — API slice and list page

The app's RTK Query `baseApi` carries the token and base URL, so a slice only names the endpoints. `ignoreError` keeps the global error toast quiet where the form shows the error itself (step 7).

```ts
import { baseApi } from '@/shared/api/baseApi'

export const globalVariableApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getGlobalVariables: b.query<Paginated<GlobalVariableListItem>, ListParams>({
      query: (params) => ({ url: '/global-variable/all', params }),
    }),
    getGlobalVariable: b.query<GlobalVariable, number>({
      query: (id) => `/global-variable/${id}`,
    }),
    getGlobalVariableValues: b.query<GlobalVariableValue[], { ids: number[] } | { workflowId: number }>({
      query: (arg) => ({
        url: '/global-variable/values',
        params: 'ids' in arg ? { ids: arg.ids.join(',') } : { workflowId: arg.workflowId },
      }),
    }),
    createGlobalVariable: b.mutation<GlobalVariable, GlobalVariableRequest>({
      query: (body) => ({ url: '/global-variable', method: 'POST', body, customOptions: { ignoreError: true } }),
    }),
    updateGlobalVariable: b.mutation<GlobalVariable, { id: number; body: GlobalVariableRequest }>({
      query: ({ id, body }) => ({ url: `/global-variable/${id}`, method: 'PUT', body, customOptions: { ignoreError: true } }),
    }),
    previewImpact: b.mutation<GlobalVariableImpact, { id: number; body: ImpactRequest }>({
      query: ({ id, body }) => ({ url: `/global-variable/${id}/impact`, method: 'POST', body }),
    }),
  }),
})
```

The list page calls `GET /global-variable/all?page=0&size=20&sort=name,asc` (row shape in section 4). Show **Create** only with the `CREATE` component right, and per row **Edit** / **Delete** only when `myPermissions` holds `EDIT` / `DELETE`.

### Step 2 — Create a constant and a secret

While the user types the name, `GET /global-variable/unique/idoitUrl` answers `{"result": true}` when it is free.

```http
POST /global-variable

{
  "name": "idoitUrl",
  "kind": "CONSTANT",
  "description": "i-doit JSON-RPC endpoint",
  "value": "https://cmdb.example",
  "secret": false,
  "scope": { "type": "ALL" }
}
```

The answer is the detail DTO: `id` 7, `version` 1, and `myPermissions` with all three rights, because the creator owns it. The API key is the same body with `"name": "idoitApiKey"`, the key as `value` and `"secret": true`. Its answer has `"value": null, "hasValue": true`; the key is never shown again. To change only its description later, send the `PUT` without `value` and the key stays.

### Step 3 — Create the mutable cursor

```http
POST /global-variable

{
  "name": "lastSync",
  "kind": "MUTABLE",
  "description": "Cursor for the VMware sync",
  "value": "2026-11-01T00:00:00Z",
  "secret": false,
  "scope": { "type": "CATEGORIES", "categoryIds": [3] },
  "ownerWorkflowId": 42,
  "busyPolicy": "QUEUE"
}
```

The owner dropdown lists only workflows inside the chosen scope; a workflow outside it answers 400 `OWNER_WORKFLOW_INVALID` on field `ownerWorkflowId`. The answer (`id` 12) starts the current value at the initial one:

```json
"mutable": {
  "currentValue": "2026-11-01T00:00:00Z",
  "revision": 0,
  "setAt": "2026-11-17T09:00:00Z",
  "setBy": { "type": "USER", "id": 1, "name": "admin" },
  "setByExecutionId": null,
  "busyPolicy": "QUEUE",
  "ownerWorkflow": { "id": 42, "title": "VMware → i-doit" }
}
```

### Step 4 — Use the variables in the workflow

The reference picker in the workflow editor calls `GET /global-variable/picker?connectionId=42` (`?categoryId=3` before the first save). Picking an entry inserts `{{global.name}}` at the cursor. The globalWrites editor offers only entries with `"writable": true`; `lastSync` is one, because workflow 42 owns it. A mutable entry another workflow owns can be shown disabled with its `ownerWorkflow.title`. Before the first save every entry has `"writable": false`, because a new workflow owns nothing yet. The method then holds:

```json
{
  "color": "#ababab",
  "name": "getChangedObjects",
  "request": {
    "endpoint": "{{global.idoitUrl}}/api",
    "header": { "Authorization": "Bearer {{global.idoitApiKey}}" },
    "body": { "fields": { "filter": { "changed_since": "{{global.lastSync}}" } } }
  },
  "globalWrites": { "global.lastSync": "#ababab.(response).body.$.updatedAt" }
}
```

The workflow saves through the existing `PUT /connection/42`. A broken reference comes back as 400, with `color` and `index` to highlight the element:

```json
{
  "status": 400, "error": "GLOBAL_REFERENCE_INVALID",
  "message": "Only the owner workflow of global variable 'lastSync' may write it, and this workflow is not its owner",
  "violations": [
    { "code": "NOT_OWNER", "message": "Only the owner workflow of global variable 'lastSync' may write it, and this workflow is not its owner",
      "variable": "lastSync", "ref": "global.lastSync", "color": "#ababab", "index": "0", "field": "globalWrites" }
  ]
}
```

### Step 5 — Watch the run live

The list page polls the visible constant and mutable rows; script rows have no value and would answer 400 `SCRIPT_HAS_NO_VALUE`. The workflow editor polls `{ workflowId: 42 }` instead.

```ts
const ids = rows.filter((row) => row.kind !== 'SCRIPT').map((row) => row.id)
const { data: values } = useGetGlobalVariableValuesQuery(
  { ids },
  { skip: ids.length === 0, pollingInterval: 5000, skipPollingIfUnfocused: true },
)
```

The ETag needs no code. The answer carries `ETag` and `Cache-Control: no-cache`, so the browser sends `If-None-Match` by itself and turns a 304 into the stored 200; RTK Query gets equal data and nothing re-renders. Don't set `If-None-Match` by hand: `fetchBaseQuery` treats a 304 as an error, and on a cross-origin setup the script can't read `ETag`, because CORS exposes only `GroupPermissionOperations` and `Authorization`.

While run 511 goes, row 12 has `beingUpdatedBy` set: show "Being updated by run 511" with a link to workflow 42. The run's writes show up at once, each with a higher `revision` and `updatedBy: null`. When the run ends, the next answer has `"beingUpdatedBy": null`.

### Step 6 — Change log and reset

`GET /global-variable/12/changes?page=0&size=20` lists the run on top as one `RUN_WRITE` entry (example in section 7). Show it as "VMware → i-doit, run 511, 312 writes", link `actor` to the workflow and `executionId` to its run log, and show no **Restore** (`restorable` is false).

**Reset** calls `POST /global-variable/12/reset` with no body. The answer is the detail DTO with `mutable.currentValue` back to `value` and `revision` one higher; the log gains a `RESET` entry.

### Step 7 — Edit with impact preview and version

The edit form loaded `version` 1 and the user narrows the scope to workflow 42. Before saving, send the same fields to the preview:

```http
POST /global-variable/12/impact

{ "name": "lastSync", "scope": { "type": "WORKFLOWS", "workflowIds": [42] } }
```

It answers `{"blocking": [], "warnings": []}`, so the form saves:

```http
PUT /global-variable/12

{
  "name": "lastSync",
  "kind": "MUTABLE",
  "description": "Cursor for the VMware sync",
  "value": "2026-11-01T00:00:00Z",
  "scope": { "type": "WORKFLOWS", "workflowIds": [42] },
  "version": 1
}
```

The answer has `version` 2; `ownerWorkflowId` and `busyPolicy` were left out, so they stay. Errors map onto the form like this:

```ts
try {
  await updateGlobalVariable({ id: 12, body }).unwrap()
} catch (e) {
  const err = (e as { data?: GlobalVariableError }).data
  if (err?.status === 400) {
    err.violations?.forEach((v) => form.setError(v.field, { message: v.message }))
  } else if (err?.code === 'VERSION_CONFLICT') {
    showReloadDialog(err.message) // someone saved first: reload, then re-apply the edit
  } else if (err?.blocking?.length) {
    showBlockingList(err.blocking) // SCOPE_NARROWING, IN_USE or PARAMETER_BREAKING
  }
}
```

### Step 8 — Add a script variable and call it

The script form's **Test** button runs the code without saving:

```http
POST /global-variable/validate-script

{
  "name": "formatDate",
  "language": "js",
  "code": "var d = new Date(date);\nvar dd = ('0' + d.getUTCDate()).slice(-2);\nvar mm = ('0' + (d.getUTCMonth() + 1)).slice(-2);\nreturn pattern === 'dd.MM' ? dd + '.' + mm : dd + '.' + mm + '.' + d.getUTCFullYear();",
  "parameters": [
    { "name": "date", "required": true },
    { "name": "pattern", "required": false, "default": "dd.MM.yyyy" }
  ],
  "testArguments": ["2026-11-17T22:00:00Z", "dd.MM"]
}
```

It answers `{"valid": true, "result": "17.11", "resultJsonType": "string", "durationMs": 3, "error": null}`. Saving is `POST /global-variable` with `"kind": "SCRIPT"`, `"scope": {"type": "ALL"}` and the same `language`, `code` and `parameters` under `script`, and no `value`.

In a `js` enhancement, picking `formatDate` appends `//var VAR_1 = {{global.formatDate}};` to `args`, and the code calls it as `VAR_1(VAR_0, 'dd.MM')`. Section 10 has the full enhancement.

### Step 9 — Delete

The delete dialog asks first:

```http
POST /global-variable/12/impact

{ "delete": true }
```

```json
{
  "blocking": [
    { "sourceType": "WORKFLOW", "sourceId": 42, "sourceTitle": "VMware → i-doit", "elementType": "METHOD",
      "elementLabel": "getChangedObjects", "color": "#ababab", "index": "0", "field": "globalWrites", "reason": "IN_USE" }
  ],
  "warnings": []
}
```

List each entry with its "Used by" link (`/workflow/update/42?element=0`) and keep **Delete** disabled. Once nothing uses the variable, `DELETE /global-variable/12` answers 204. Skipping the preview gets the same list as a 409 `IN_USE`.

## 13. TypeScript types

These types mirror the backend records under `resource/globalvariable` field for field. Responses always send every field, so `| null` means present but possibly null; `?` marks a field that may be absent, which happens only in requests and in `GlobalVariableError`, in `Blocking.parameter`, in the run log's `globalSnapshot` entries and in the `violations` of `GLOBAL_REFERENCE_INVALID`. Copy the block into `globalVariable.types.ts`; step 1 of section 12 uses it.

```ts
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
export type IsoInstant = string // ISO-8601 UTC, e.g. "2026-11-17T22:04:11Z"

export type GlobalVariableKind = 'CONSTANT' | 'MUTABLE' | 'SCRIPT'
export type ScopeType = 'ALL' | 'CATEGORIES' | 'WORKFLOWS'
export type BusyPolicy = 'QUEUE' | 'REFUSE'
export type VariablePermission = 'VIEW_USE' | 'EDIT' | 'DELETE'
export type ScriptLanguage = 'js' | 'python3' | 'ruby'

export interface Actor { type: 'USER' | 'WORKFLOW'; id: number; name: string | null }
export interface UserRef { id: number; name: string | null }
export interface WorkflowRef { id: number; title: string | null }
export interface CategoryRef { id: number; name: string | null }
export interface BeingUpdatedBy { workflowId: number; executionId: number | null; startedAt: IsoInstant }

export interface Paginated<T> { content: T[]; currentPage: number; totalPages: number; totalItems: number }
export interface ListParams { page?: number; size?: number; sort?: string; search?: string; kind?: GlobalVariableKind }

// GET /all
export interface GlobalVariableListItem {
  id: number
  name: string
  kind: GlobalVariableKind
  description: string | null
  secret: boolean
  valuePreview: string | null // JSON text, first 100 characters; null for secrets and scripts
  language: ScriptLanguage | null // scripts only
  parameterCount: number | null // scripts only
  scopeType: ScopeType
  usageCount: number
  myPermissions: VariablePermission[]
  version: number
  updatedAt: IsoInstant | null
  updatedBy: Actor | null
  beingUpdatedBy: BeingUpdatedBy | null // mutable only, while an owner run goes
}

// GET /{id}, and the answer of POST, PUT, restore and reset
export interface ScriptParameter { name: string; description: string | null; required: boolean; default: Json }
export interface Script { language: ScriptLanguage; code: string; parameters: ScriptParameter[] }

export interface MutableState {
  currentValue: Json // what runs read
  revision: number // +1 on every new current value
  setAt: IsoInstant | null
  setBy: Actor | null // null when a run wrote it
  setByExecutionId: number | null
  busyPolicy: BusyPolicy
  ownerWorkflow: WorkflowRef | null // null once the owner workflow is deleted
}

export interface GlobalVariable {
  id: number
  name: string
  kind: GlobalVariableKind
  description: string | null
  value: Json // null for secrets and scripts; the initial value of a mutable variable
  secret: boolean
  hasValue: boolean
  script: Script | null
  scope: { type: ScopeType; categories: CategoryRef[]; workflows: WorkflowRef[] }
  ownerUser: UserRef | null
  myPermissions: VariablePermission[]
  mutable: MutableState | null
  version: number // send back on PUT, restore and permissions PUT
  createdAt: IsoInstant
  createdBy: Actor | null
  updatedAt: IsoInstant | null
  updatedBy: Actor | null
}

// POST / and PUT /{id}
export interface ScriptParameterRequest { name: string; description?: string | null; required?: boolean; default?: Json }

export interface GlobalVariableRequest {
  name: string
  kind: GlobalVariableKind
  description?: string | null
  value?: Json // leave out for a script, and on PUT to keep a secret
  secret?: boolean
  scope: { type: ScopeType; categoryIds?: number[]; workflowIds?: number[] }
  busyPolicy?: BusyPolicy // mutable only; left out = QUEUE on POST, kept on PUT
  ownerWorkflowId?: number // mutable only; required on POST, kept on PUT
  version?: number // required on PUT
  script?: { language: ScriptLanguage; code: string; parameters: ScriptParameterRequest[] } // script only
}

// GET /values
export interface GlobalVariableValue {
  id: number
  version: number
  revision: number // always 0 for constants
  value: Json // current value of a mutable variable; null for secrets
  updatedAt: IsoInstant | null
  updatedBy: Actor | null // null when a run wrote it
  beingUpdatedBy: BeingUpdatedBy | null
}

// GET /picker
export interface GlobalVariablePickerItem {
  name: string
  kind: GlobalVariableKind
  description: string | null
  secret: boolean
  valuePreview: string | null
  language: ScriptLanguage | null
  parameters: ScriptParameter[] | null // scripts only, in call order
  ownerWorkflow: WorkflowRef | null // mutable only; null once the owner workflow is deleted
  writable: boolean // true when connectionId is the owner workflow
}

// GET /{id}/usage, and blocking / warnings of impact and 409
export type UsageSourceType = 'WORKFLOW' | 'CONNECTOR' | 'NOTIFICATION'
export type UsageElementType = 'METHOD' | 'OPERATOR' | 'ENHANCEMENT'

export interface GlobalVariableUsage {
  sourceType: UsageSourceType
  sourceId: number
  sourceTitle: string | null
  elementType: UsageElementType | null // null for connectors and notifications
  elementLabel: string | null
  color: string | null
  index: string | null // null outside a workflow
  field: string | null
  access: 'READ' | 'WRITE' | 'IMPORT'
}

export interface Blocking extends Omit<GlobalVariableUsage, 'access'> {
  reason: 'IN_USE' | 'OUT_OF_SCOPE' | 'PARAMETER_BREAKING' | 'CALLS_IN_CODE_NOT_CHECKED'
  parameter?: string // PARAMETER_BREAKING only
}

// POST /{id}/impact
export type ImpactRequest =
  | { delete: true }
  | { name?: string; scope?: GlobalVariableRequest['scope']; script?: GlobalVariableRequest['script'] }
export interface GlobalVariableImpact { blocking: Blocking[]; warnings: Blocking[] }

// GET /{id}/changes
export type ChangeType = 'CREATE' | 'VALUE' | 'CONFIG' | 'PERMISSIONS' | 'RESTORE' | 'DELETE' | 'RESET' | 'RUN_WRITE'

export interface GlobalVariableChange {
  id: number
  changeType: ChangeType
  versionFrom: number | null
  versionTo: number | null
  oldValue: Json // "••••" for secrets; null for CONFIG and PERMISSIONS
  newValue: Json
  changedFields: { field: string; old: Json; new: Json }[] | null
  actor: Actor | null // type WORKFLOW on RUN_WRITE
  executionId: number | null // RUN_WRITE only
  writeCount: number | null // RUN_WRITE only
  result: 'SAVED' | 'REJECTED'
  reason: string | null
  changedAt: IsoInstant
  restorable: boolean
}

// POST /{id}/restore/{changeId}
export interface RestoreRequest { version: number }

// GET and PUT /{id}/permissions
export interface GlobalVariablePermissions {
  ownerUser: UserRef | null
  grants: { user: UserRef; permissions: VariablePermission[] }[]
  version: number
}
export interface PermissionsRequest { grants: { userId: number; permissions: VariablePermission[] }[]; version: number }

// POST /validate-script
export interface ScriptTestRequest {
  name?: string
  language: ScriptLanguage
  code: string
  parameters: ScriptParameterRequest[]
  testArguments: Json[]
}
export interface ScriptTestResult {
  valid: boolean
  result: Json
  resultJsonType: 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | null
  durationMs: number | null
  error: { code: string; message: string; line: number | null; column: number | null } | null
}

// 400 and 409 of /global-variable; fields that do not apply are left out; a 409 always has blocking, [] when empty
export interface GlobalVariableError {
  timestamp: IsoInstant
  status: 400 | 409
  error: 'GLOBAL_VARIABLE_INVALID' | 'GLOBAL_VARIABLE_CONFLICT'
  code?: 'VERSION_CONFLICT' | 'IN_USE' | 'SCOPE_NARROWING' | 'PARAMETER_BREAKING' | 'BUSY' // 409 only
  message: string
  path: string
  currentVersion?: number // 409 only
  violations?: { field: string; code: string; message: string }[] // 400 only
  blocking?: Blocking[] // 409 only
}
```

The workflow, connector and notification saves answer 400 with `error` `GLOBAL_REFERENCE_INVALID` instead; their `violations` add `variable`, `ref`, `color` and `index` (section 10).
