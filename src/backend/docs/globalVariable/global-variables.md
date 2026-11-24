# Global variables — user guide

A global variable is a named value that you define once and then use in any number of
workflows, connectors and notifications. Change it in one place and every place that uses it
follows.

This guide is for people who build workflows. It explains the three kinds of variable, how to
reference one, and what happens to it while a workflow runs. A workflow is what the API and
older screens call a *connection*.

Typical uses:

- the base URL or an API key of a system that many workflows call (a **constant**);
- the time of the last successful sync, which each run reads and then moves forward
  (a **mutable variable**);
- a small function, such as a date formatter, that many field bindings share
  (a **script variable**).

---

## 1. The three kinds

The kind is chosen when the variable is created and cannot be changed afterwards.

| Kind | Holds | Who changes it | What a running workflow sees |
|------|-------|----------------|------------------------------|
| **Constant** | Any value | Users with Edit permission. A workflow can never write it. | The value from the moment the run started. A later edit applies from the next run. |
| **Mutable variable** | Any value, starting from an initial value | Users with Edit permission, and runs of its *owner workflow* | The live value at each read, including what a run of the owner workflow wrote a moment ago |
| **Script variable** | A function with declared parameters | Users with Edit permission | A function that enhancement code calls. It has no stored value. |

---

## 2. Creating a variable

| Field | Rules |
|-------|-------|
| Name | 1 to 64 letters, digits or `_`, starting with a letter. Unique in the whole system, whatever the case: `apiKey` and `APIKEY` cannot both exist. |
| Kind | Constant, mutable or script. Fixed after creation. |
| Description | Free text, at most 512 characters. |
| Value | Constant and mutable only. Any JSON value, see [Values](#3-values). For a mutable variable this is the *initial* value. |
| Secret | Constant only. Hides the value after saving, see [Secrets](#61-secrets). |
| Scope | Which workflows may use the variable, see [Scope](#4-scope). |
| Owner workflow | Mutable only, required. The one workflow whose runs may write the variable. It must lie inside the scope. |
| Busy policy | Mutable only. Queue (default) or Refuse, see [One run at a time](#73-one-run-at-a-time). |
| Script | Script only. Language, code and parameters, see [Script variables](#8-script-variables). |

A reference must spell the name exactly as it was saved, including upper and lower case.

A variable that is in use cannot be renamed. Rename it before you use it, or remove the
usages first.

---

## 3. Values

A value is stored as JSON and keeps its type: text, number, boolean, null, list or map, nested
to any depth. There is no separate type field; the type is whatever you entered.

- Whole numbers keep all their digits. A decimal is kept as a double-precision number, about
  15 significant digits; send one that needs more as text.
- Dates are ISO-8601 text, for example `"2026-11-17T22:00:00Z"`. Binary data is not supported.
- One value may take up to 64 KB as JSON text. An administrator can change the limit, see
  [Limits and settings](#11-limits-and-settings).

### How a value is put into a request

| Where the reference stands | What is sent |
|----------------------------|--------------|
| A JSON body field that holds nothing but the reference | The value with its own type: a number stays a number, a map stays a map |
| A URL path, a query parameter, a header, a form field, or inside longer text | The value as text, by the table below |
| A connector field or a notification text | The value as text, by the table below |

| Value | As text |
|-------|---------|
| Text | As it is |
| Number, boolean | Its literal: `42`, `3.5`, `true` |
| List, map | Compact JSON text: `["a","b"]`, `{"max":3}` |
| null | Empty text |

---

## 4. Scope

Each variable has one scope. A workflow can use the variable only if it falls inside it.

| Scope | Which workflows can use the variable |
|-------|--------------------------------------|
| All workflows | Every workflow |
| Categories | Workflows in one of the chosen categories or in one of their subcategories. A workflow without a category, or in another category, cannot use it. |
| Workflows | Only the chosen workflows |

A scope lists several categories or several workflows, never a mix of both.

Rules for the places outside a single workflow:

- A **connector** is shared by workflows of any category, so it may only use variables with
  scope *All workflows*.
- A **notification** is checked against the workflow that its schedule runs.

Scope is checked at three moments:

1. **When you save** a workflow, connector, notification or notification template. The save is
   refused and every offending reference is listed with its place.
2. **When a run starts**, because a scope can change after the save. The run fails before its
   first step. The reason goes to the workflow's live channel (websocket) and to the alert
   notifications of the schedule, not to the execution log.
3. **When you change the variable** in a way that would leave out something that uses it. The
   change is refused with the list of usages, see
   [Changing a variable that is in use](#9-changing-a-variable-that-is-in-use).

---

## 5. Permissions

Access has two layers.

**Your role** needs the *Global Variable* permission: READ to see the page and the picker,
CREATE, UPDATE and DELETE for the matching actions.

**Each variable** then has its own permissions, set by its owner per user:

| Permission | Allows |
|------------|--------|
| Use | See the variable and its value, and reference it in workflows, connectors and notifications |
| Edit | Use, plus change the name, description, value, script, parameters, scope and settings, and reset or restore the value |
| Delete | Use, plus delete the variable |
| Owner | Everything, plus manage the permissions of other users |

- Whoever creates a variable owns it. A new variable is private to its owner until the owner
  grants permissions.
- Administrators hold every permission on every variable.
- Permissions are granted per user. There are no grants per role or group.
- Lists, the picker and the current values only show variables you may use.
- If you lose Use permission, references that are already in a workflow stay and keep working.
  You cannot add the variable to a workflow, connector or notification that does not use it yet.
- A run does not check user permissions. It checks that the variable exists and is in scope.

---

## 6. Using a variable

### Reference syntax

```
{{global.name}}                      the whole value
{{global.limits.maxPerPage}}         a field of a map
{{global.tenants[0].id}}             an element of a list, then a field
{{global.regions['eu-west'].url}}    a key that is not a plain word
```

`global` is the store of global variables, and everything after the name is a path into the
value. A path that leads nowhere, such as a missing key or an index past the end of a list,
gives null. Only a missing *variable* is an error.

To send the characters `{{global.name}}` as literal text, put a backslash in front:
`\{{global.name}}`. The backslash is removed and nothing is resolved.

### Where a reference may stand

| Place | Read a constant or mutable variable | Call a script variable | Write a mutable variable |
|-------|-------------------------------------|------------------------|--------------------------|
| Method: endpoint, headers, body | Yes | No | Yes, in its `globalWrites`, see [Writing](#72-writing-the-value) |
| Operator: condition, loop source | Yes | No | No |
| Enhancement of a field binding | Yes, in its args or with `ref("{{global.name}}")` in its code | Yes, see [Script variables](#8-script-variables) | Yes, with `set()` in JavaScript |
| Connector: its request data fields | Yes, scope *All workflows* only | No | No |
| Notification template: subject, body | Yes | No | No |

### Loops over a variable

A loop operator can take a global variable as its source.

| Operator | Value it walks | Reference to the current element |
|----------|----------------|----------------------------------|
| `for` | A list | `{{global.tenants[i].id}}` |
| `forin` | The keys of a map, or the indexes of a list | `{{global.regions['j'].url}}` |
| `SplitString` | The parts of a text | `{{global.csv[k]~}}` |

`i`, `j` and `k` are the iterators of the loops. A value of another type fails the loop.

### 6.1 Secrets

A constant can be marked as a secret, for example an API key.

- The value is stored encrypted and is never shown again, not in the form, not in the current
  values and not in the change log.
- Workflows use it like any other constant.
- The execution log writes `••••` in place of the value, and hides the secret's text wherever
  else it would appear in the log. A secret shorter than 4 characters is too short to be hidden
  this way, so do not use one.
- Saving without a new value keeps the hidden one. To make a secret visible again you must enter
  a new value.
- A secret cannot be restored from the change log.
- Mutable and script variables cannot be secrets.

Each installation should set its own encryption key before the first secret is saved. See
"Key for secret global variables" in [feature.md](../appYml/feature.md).

---

## 7. Mutable variables

### 7.1 Initial and current value

A mutable variable stores two values:

- the **initial value**, which you enter in the form;
- the **current value**, which runs change.

Saving the form changes the initial value only. The current value changes through a write by
a run, or through **Reset**, which sets it back to the initial value. The current value is
shared by all runs and survives a restart of OpenCelium.

### 7.2 Writing the value

Only runs of the **owner workflow** write the variable. Every other workflow in scope can read
it, and reads the live value.

The reference picker shows, for each mutable variable, its owner workflow, and the globalWrites
editor and `set()` offer only the variables the workflow being edited owns. A workflow that is
not saved yet owns nothing: save it first, make it the owner workflow of the variable, then add
the writes.

A write always replaces the whole value. There is no write to a path inside it. The size limit
of a value applies to a written value too.

**From a method.** A method lists the variables it writes in `globalWrites`. The target is
written `global.name`, without braces and without a path:

```json
"globalWrites": {
  "global.lastSync": "#00A3FF.(response).body.$.serverTime",
  "global.syncState": "{\"status\": \"ok\", \"page\": 1}"
}
```

The value is a reference, which is resolved like any other, or JSON text, or plain text. The
write happens after the method's response has arrived, so the value may read that response,
and later steps read the new value.

**From a JavaScript enhancement.** The code calls `set` with the full reference and the value:

```javascript
set("{{global.lastSync}}", VAR_0);
```

The writes of an enhancement are made once its code has finished. An enhancement that fails
writes nothing. `set` is available in JavaScript enhancements only.

Good to know:

- A failed run does not roll back what it already wrote.
- A **test run** of a workflow reads the real values but keeps its writes to itself. Testing
  never changes a value that production runs rely on.
- If the owner workflow is deleted, the variable has no writer until someone with Edit
  permission picks another one.

### 7.3 One run at a time

A workflow that uses a mutable variable, even one that only reads it, runs one execution at a
time. So does the owner workflow of a mutable variable. While it runs, a second start of the *same* workflow follows the busy policy of the
variable:

| Busy policy | What happens to the second start |
|-------------|----------------------------------|
| Queue (default) | It waits and starts when the running execution ends. No step runs before that. |
| Refuse | It does not start. |

- If a workflow uses several mutable variables and one of them says Refuse, the start is refused.
- The queue is per workflow and first in, first out.
- A waiting start reads the constants as they are when it leaves the queue, not when it entered.
- A workflow becomes free when its run ends in any way: success, failure, cancel or timeout.
- Two *different* workflows that use the same mutable variable still run at the same time.
- Workflows that use only constants and scripts are not affected. They run in parallel as before.

**Queue limits.** At most 100 starts wait per workflow, and a start waits at most 60 minutes.
Past either limit the start is refused or dropped. A second start of the *schedule* that is
running waits outside the queue until that run ends, so the limits do not count it meanwhile;
then it is handled like any other start.

**Scheduled starts.** A schedule keeps at most one waiting start fired by its timer. Further
timer fires of that schedule are skipped while one waits. Manual starts and webhook starts are
all kept, because each was asked for or carries its own data.

**What you see when a start is refused.**

| Start | Refused | What you see |
|-------|---------|--------------|
| Manual start | On the call | HTTP 409 with code `BUSY`. Nothing is recorded. |
| Webhook call | On the call | HTTP 409 with code `BUSY`. The refused calls are counted, and when the run ends each schedule gets one failed execution that names how many there were. |
| Timer fire | Skipped while an earlier fire of its schedule waits | Counted and recorded like refused webhook calls. |
| Any start | Later: when it was about to run, or it waited too long | A failed execution of its schedule. |

A failed execution of a refused start starts and ends at once. Its execution log holds the
reason only with debug mode on, and no notification is sent. Every recorded refusal also goes to
the workflow's live channel (websocket).

**After a restart.** Every workflow is free again. Starts that were waiting are lost; a schedule
fires again at its next time.

### 7.4 Who is writing it now

The current values show, for a mutable variable, the run of the owner workflow that is going on
right now: its workflow, its execution and when it started.

---

## 8. Script variables

A script variable is a reusable function. You define its language, its code and its parameters,
and enhancement code calls it.

### Defining a script

| Part | Rules |
|------|-------|
| Language | JavaScript (`js`), Python 3 (`python3`) or Ruby (`ruby`). Cannot change after creation. |
| Code | The *body* of the function. You do not write the function header. At most 256 KB, together with the parameters. |
| Parameters | In the order a call passes them. Each has a name, a description, and either is required or has a default value. |

Language rules:

- **JavaScript.** The code must `return` a value. Returning `undefined` fails the step; `null`
  is a valid result. The code may not call `ref()` or `set()`: a script works with its
  parameters only.
- **Python 3.** Code that ends without `return` gives `None`, which is null. `yield` is not
  allowed. The code cannot read the args of the enhancement that calls it.
- **Ruby.** The script returns its last expression, as a Ruby method does. `nil` is null.

The code is checked when you save: it must parse, and for JavaScript it must contain a `return`
with a value. Python and Ruby are checked by the polyglot service, so that service must be
running to save such a script.

You can **test** a script before saving it: give test arguments, and the script is checked as
saving would check it and called once. Nothing is saved.

### Calling a script

A script is used in the enhancement of a field binding, and only there. The enhancement imports
it as one of its args and its code calls it as a function:

```json
"enhancement": {
  "args":   "//var RESULT_VAR = #FFCF00.(request).body.$.title; //var VAR_0 = #00A3FF.(response).body.$.created; //var VAR_1 = {{global.formatDate}}; //var VAR_2 = {{global.tenantPrefix}};",
  "script": "RESULT_VAR = VAR_2 + '-' + VAR_1(VAR_0, 'dd.MM');"
}
```

Here `formatDate` is a script variable with the parameters `date` and `pattern` (default
`"dd.MM.yyyy"`), and `tenantPrefix` is a constant. `VAR_0` and `VAR_2` are values and `VAR_1`
is a function. With `VAR_0 = "2026-11-17T22:00:00Z"` and `VAR_2 = "ACME"`, the result is
`"ACME-17.11"`. `VAR_1(VAR_0)` would use the default pattern.

Rules for the import:

- The reference must be the whole value of the arg, without a path:
  `//var VAR_1 = {{global.formatDate}};`.
- The enhancement must be written in the language of the script.
- A script cannot be used in a text field (URL, header, body, condition, connector field,
  notification text), cannot be read with `ref()`, and cannot be written.

Rules for the call:

- Arguments are passed by position. An argument is any value the code has: a literal, another
  arg, or the result of another call.
- A parameter with a default may be left out. Leaving out a required parameter fails the step
  at run time. Saving cannot catch this, because calls sit in free code.
- Extra arguments beyond the declared parameters are allowed. They reach JavaScript code
  through `arguments`.
- A thrown error, a timeout or a missing required argument fails the step. The error names the
  script.
- The time limit is 5 seconds and covers the whole enhancement, script calls included.

A run keeps the version of the script it started with, like a constant.

---

## 9. Changing a variable that is in use

The usage list of a variable shows every workflow, connector and notification that uses it,
down to the element and field.

Some changes would break those usages. They are always refused, with the list of what stands in
the way. There is no "force" option.

| Change | Refused when | Code |
|--------|--------------|------|
| Delete | The variable is used anywhere | `IN_USE` |
| Rename | The variable is used anywhere | `IN_USE` |
| Narrow the scope | The new scope leaves out a workflow, connector or notification that uses it | `SCOPE_NARROWING` |
| Change script parameters | A parameter is removed, renamed, moved or made required, or a new one has no default, while the script is called somewhere | `PARAMETER_BREAKING` |

To make such a change, remove the listed usages first.

A scope that leaves out the owner workflow of a mutable variable is refused as well, as an
invalid field (`OWNER_WORKFLOW_INVALID`). Pick another owner workflow in the same save.

The same protection works from the other side: a workflow cannot be saved into a category that
is outside the scope of a variable it uses.

**Two people editing at once.** If someone else saved the variable after you opened it, your
save is refused with `VERSION_CONFLICT`. Reload and repeat your change.

### Change log and restore

Every variable keeps a change log, newest entry first: creation, value changes, changes of
scope and other settings, permission changes, resets, restores and deletion. A user with Edit
permission can **restore** the value that a creation, a value change or an earlier restore
saved. For a mutable variable that is the initial value; use **Reset** afterwards to make it the
current value too. For a script it is the whole script.

Writes by runs are logged too, as one entry per run and variable: the value before the run's
first write, the value of its last write and how often it wrote. The log keeps the newest 200
of these entries per variable.

---

## 10. What a run does

1. If the workflow uses a mutable variable and is already running, the start waits or is
   refused, see [One run at a time](#73-one-run-at-a-time).
2. It collects the variables in scope of the workflow and takes a **snapshot** of them before
   its first step. A start that waited takes it when it leaves the queue.
3. It checks that every referenced variable exists and is in scope. If not, the run fails
   before its first step.
4. During the run it reads constants from the snapshot, reads mutable variables live, and runs
   scripts in the version from the snapshot.
5. It stores each write to a mutable variable at once.
6. When it ends, it frees the workflow and the next waiting start begins.

With debug mode on, the execution log lists the snapshot: the name and version of every variable
in scope of the workflow, used or not, and, within limits, its value. A value over 4 KB, or
values past 32 KB in total for one run, are listed with their size instead. Secrets are masked.
A script is listed with its definition as its value.

---

## 11. Limits and settings

An administrator sets these in `application.yml` under `opencelium.global-variable`.

| Setting | Default | Meaning |
|---------|---------|---------|
| `max-value-bytes` | `65536` | Largest value of one variable, as JSON text |
| `max-script-bytes` | `262144` | Largest code of one script variable |
| `script-timeout-ms` | `5000` | How long an enhancement that calls a script may run |
| `queue.max-waiting` | `100` | How many starts may wait per workflow |
| `queue.max-wait-minutes` | `60` | How long a start may wait |
| `change-log.max-run-entries` | `200` | How many entries of run writes the change log keeps per variable |
| `secret-key` | empty | Key that encrypts secrets. Empty uses the built-in default, see [feature.md](../appYml/feature.md). |

---

## 12. Error messages

### Saving a workflow, connector or notification

The save answers HTTP 400 with error `GLOBAL_REFERENCE_INVALID` and one entry per rejected
reference, each with its message, the variable and the place.

| Code | Meaning |
|------|---------|
| `UNKNOWN_VARIABLE` | No variable has this name |
| `OUT_OF_SCOPE` | The workflow is outside the scope of the variable |
| `SCOPE_NOT_ALL` | A connector uses a variable that is not open to all workflows |
| `NO_USE_PERMISSION` | You have no Use permission on the variable and it was not used here before |
| `INVALID_WRITE_TARGET` | A write target is not `global.name` in `globalWrites`, or not `{{global.name}}` in `set()`; a path is not allowed |
| `NOT_MUTABLE` | A write targets a constant or a script |
| `NOT_OWNER` | A workflow writes a mutable variable whose owner is another workflow |
| `SCRIPT_NOT_CALLABLE` | A script variable is used other than as the whole value of an enhancement arg |
| `IMPORT_LANGUAGE_MISMATCH` | A script is imported into an enhancement of another language, or of none |

### Saving a variable

A rejected field answers HTTP 400 with error `GLOBAL_VARIABLE_INVALID` and one entry per field.
The most common codes:

| Code | Meaning |
|------|---------|
| `NAME_INVALID`, `NAME_TAKEN` | The name breaks the naming rule, or is already used |
| `VALUE_TOO_LARGE` | The value or the script code is over its size limit |
| `SCOPE_REQUIRED`, `SCOPE_INVALID` | No scope, an empty list, or a category or workflow that does not exist |
| `OWNER_WORKFLOW_REQUIRED`, `OWNER_WORKFLOW_INVALID` | A mutable variable has no owner workflow, or it does not exist or is outside the scope |
| `SECRET_NOT_ALLOWED` | A mutable or script variable was marked as a secret |
| `SECRET_REMOVAL_NEEDS_VALUE` | A secret was made visible without a new value |
| `SCRIPT_SYNTAX`, `NO_RETURN_VALUE`, `SCRIPT_NOT_PURE` | The code does not parse, a JavaScript script returns nothing, or it calls `ref()` or `set()` |
| `PARAMETER_INVALID` | A parameter name is not valid, is reserved or is declared twice, its description is over 512 characters, or a required parameter has a default |
| `SCRIPT_HAS_NO_VALUE` | A script variable was saved with a value, or its value was asked for |
| `SCRIPT_ENGINE_UNAVAILABLE` | The polyglot service that checks Python and Ruby code did not answer |
| `NOT_RESTORABLE` | The change log entry holds no value to restore, or the variable is a secret |

A conflict answers HTTP 409 with error `GLOBAL_VARIABLE_CONFLICT` and one of `VERSION_CONFLICT`,
`IN_USE`, `SCOPE_NARROWING`, `PARAMETER_BREAKING` or `BUSY`. For `IN_USE`, `SCOPE_NARROWING` and
`PARAMETER_BREAKING` it lists the usages that block the change; for the other two the list is
empty.

### During a run

A reference that cannot be resolved, a write that is not allowed and a failing script fail the
step. The message names the variable and, with debug mode on, is written to the execution log.

---

## 13. API overview

For integrations and scripts. All paths are under `/global-variable`.

"Needs" names a role permission (upper case) or a permission on the variable. A permission on
the variable also needs the role permission: READ to read, UPDATE to change, restore or reset,
DELETE to delete, and UPDATE or DELETE for the impact preview. Reading or replacing the grants
needs READ or UPDATE besides being the owner or an administrator.

| Method and path | Purpose | Needs |
|-----------------|---------|-------|
| `POST /global-variable` | Create a variable | Role permission CREATE |
| `GET /global-variable/all` | List, paged. Filters: `search`, `kind`. Shows only the variables you may use | Role permission READ |
| `GET /global-variable/{id}` | Read one variable | Use |
| `GET /global-variable/unique/{name}` | Check that a name is free | Role permission READ |
| `PUT /global-variable/{id}` | Change. The body carries the version that was loaded | Edit |
| `DELETE /global-variable/{id}` | Delete | Delete |
| `POST /global-variable/{id}/impact` | Tell what a change or a delete would block, before it is saved | Edit, or Delete for a delete |
| `GET /global-variable/{id}/usage` | List where the variable is used | Use |
| `GET /global-variable/{id}/permissions` | Read the grants | Owner or administrator |
| `PUT /global-variable/{id}/permissions` | Replace the grants | Owner or administrator |
| `GET /global-variable/{id}/changes` | Change log, newest first, paged | Use |
| `POST /global-variable/{id}/restore/{changeId}` | Restore the value a change log entry saved | Edit |
| `POST /global-variable/{id}/reset` | Set a mutable variable back to its initial value | Edit |
| `GET /global-variable/picker` | Variables usable in one place: `connectionId`, `categoryId`, `connectorId` or `schedulerId`. For a mutable variable it names the owner workflow and tells whether the `connectionId` workflow may write it | Role permission READ; lists only variables you may use |
| `POST /global-variable/validate-script` | Check and test-run a script without saving | Role permission CREATE or UPDATE |
| `GET /global-variable/values` | Current values of constants and mutable variables | Role permission READ; returns only variables you may use |

### Current values

`GET /global-variable/values?ids=1,2,3` returns up to 100 variables.
`GET /global-variable/values?workflowId=7` returns every constant and mutable variable in scope
of that workflow. Give one of the two, not both.

Each item has `id`, `version`, `revision`, `value`, `updatedAt`, `updatedBy` and
`beingUpdatedBy`:

- `version` changes when a user saves the definition.
- `revision` counts how often the current value of a mutable variable was set. It is 0 for a
  constant.
- `value` is always null for a secret.
- `beingUpdatedBy` names the running execution of the owner workflow, or is null.

Script variables have no value and are not returned. The response carries an `ETag`; send it
back in `If-None-Match` and an unchanged poll answers 304 without a body.
