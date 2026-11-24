# Global Variables — Spec

Nov 23, 2026 · @Bob Mustaev

## Summary

A global variable is a named value that a user defines once and then references from workflows, connectors and notifications. It comes in three kinds: a constant, a mutable variable and a script variable.

In scope:

- Create, edit and delete global variables of the three kinds.
- Values of any type (string, number, boolean, array, map, nested object) keeping their type, and cast to text only where text is needed.
- Scope per variable: all workflows, one or more categories, or specific workflows. The backend rejects use outside the scope.
- Per-user permissions set by the creator: use, edit, delete.
- A new reference type, usable in methods, operators, enhancements, field bindings, connectors and notifications.
- One execution at a time for a workflow that uses a mutable variable. A second start waits in a queue or is refused.
- An HTTP endpoint that returns current values of constants and mutable variables.
- Script variables in JavaScript, plus the other GraalVM languages we support (Python, Ruby).

Out of scope: live push of values to the UI. The UI polls values over HTTP. Only refused starts are also sent to the workflow's existing websocket channel.

## Variable kinds

A variable has one of three kinds, chosen at creation and fixed afterwards.

| Kind | Holds | Who can change it | What a running execution sees |
| --- | --- | --- | --- |
| Constant | Any value | Users with Edit permission. No process can write it. | The value from the moment the execution started. A later change applies from the next start. |
| Mutable variable | Any value, starting from a predefined initial value | Users with Edit permission, and running executions of its owner workflow | The live value at each read, including what a run of its owner workflow wrote a moment ago |
| Script variable | A function with declared parameters | Users with Edit permission | A function that enhancement code calls; each call returns a value computed from the arguments the code passes |

**Name for the second kind.** Mutable variable, as in the code (MUTABLE): its value changes between steps and executions, and it reads well next to Constant and Script. Also considered: State variable, Dynamic variable, Runtime variable. Plain "Variable" collides with "global variable", the name of the whole feature.

### Constant

- A write from a workflow is rejected when the workflow is saved, and again at run time.
- Each edit creates a new version. Executions already running keep the version they started with.

### Mutable variable

- It stores two values: the initial value set by the user, and the current value changed by executions.
- The current value is shared by all executions and survives a restart.
- A workflow that uses or owns it runs one execution at a time. Its busy policy, Queue or Refuse, decides what happens to a second start. See Runtime semantics.
- A write replaces the whole current value atomically. Only runs of its owner workflow write it, and they run one at a time, so two writes never overlap.
- A failed execution does not roll back its writes.
- A user with Edit permission can reset the current value to the initial value.
- It has one owner workflow, chosen by a user with Edit permission. Any workflow in scope can read the variable; only the owner writes it.
- The owner workflow must lie inside the variable's scope. A scope change that leaves it out is refused.
- Deleting the owner workflow leaves the variable without a writer until a user with Edit permission picks another one.
- Saving a value in the edit form changes the initial value. The current value changes only through a reset or a write.
- A mutable variable cannot be a secret.

### Script variable

- The creator defines the language, the function body and the parameters. A parameter has a name and a description, and is either required or has a default value; a required parameter with a default is refused as `PARAMETER_INVALID`.
- A JavaScript function must always return a value: on save, the source must parse and contain a `return`, and at run time a result of `undefined` fails the step. A Python function may end without a `return`: it then gives `None`, which is null, as `return None` does. A Ruby script returns its last expression, as a Ruby method does, and `nil` is null. Python and Ruby source must parse on save, which the polyglot service checks.
- It is used only in enhancement code. The enhancement imports it as one of its args, `//var VAR_1 = {{global.formatDate}};`, and its code calls it as a function: `VAR_1(VAR_0, 'dd.MM')`.
- A call may leave out a parameter that has a default value. A call that leaves out a parameter without a default fails the step at run time: calls sit in free code, so saving cannot check them.
- Arguments beyond the declared parameters are allowed and reach the code through JavaScript's `arguments`.
- An argument is any value the enhancement code has: a literal, another imported arg, or the result of another call.
- A script is meant as a pure function: it uses only its parameters. JavaScript code that calls `ref()` or `set()` is refused on save as `SCRIPT_NOT_PURE`, and Python and Ruby code runs without the enhancement's args. Beyond that it is documented, not enforced.
- While a script is called somewhere, a parameter change that breaks the calls is refused as `PARAMETER_BREAKING`: removing, renaming or moving a parameter, making one required, or adding one without a default. Calls pass arguments by position.
- Running executions keep the script version they started with, like a constant.

Saving a workflow, connector, notification or notification template refuses a script variable used anywhere except as the whole value of an enhancement's arg, `//var VAR_n = {{global.name}};`. It is refused as `SCRIPT_NOT_CALLABLE` in a text field (method URL, header or body, operator condition or loop source, a value a method writes, connector field, notification text). The same holds for `ref("{{global.formatDate}}")` in enhancement code, a path (`{{global.formatDate.x}}`, args included) and a reference that is only part of an arg's value. An import into an enhancement written in another language than the script, or in none, is refused as `IMPORT_LANGUAGE_MISMATCH`. A write to a script is refused as `NOT_MUTABLE`. The where-used list records each import with access `IMPORT`.

Example. The script variable `formatDate` (language js) has the parameters `date` and `pattern` (default `"dd.MM.yyyy"`) and returns a text. A field binding uses it like this:

```json
"enhancement": {
  "args":   "//var RESULT_VAR = #FFCF00.(request).body.$.title; //var VAR_0 = #00A3FF.(response).body.$.created; //var VAR_1 = {{global.formatDate}}; //var VAR_2 = {{global.tenantPrefix}};",
  "script": "RESULT_VAR = VAR_2 + '-' + VAR_1(VAR_0, 'dd.MM');"
}
```

Each import gets the next `VAR_n`, as a method field does today. `VAR_0` and `VAR_2` are values; `VAR_1` is a function, because `formatDate` is a script. With `VAR_0 = "2026-11-17T22:00:00Z"` and `VAR_2 = "ACME"`, `RESULT_VAR` becomes `"ACME-17.11"`. `VAR_1(VAR_0)` uses the default pattern.

## Value model

Every value is stored as JSON with no declared type: null, boolean, number, string, array or map, nested to any depth.

- Whole numbers keep all their digits. A decimal is read as a double-precision number, about 15 significant digits; a value that needs more is sent as text.
- Dates are ISO-8601 strings. Binary data is not supported.
- Size limit: 64 KB per value, configurable with `max-value-bytes`.
- A reference can point inside a value by path: `config.retry.max`, `orders[0].id`. A missing path gives null.
- The UI shows the detected type next to the value.

There is no general autocasting. A value keeps its JSON type, and is cast to text only where only text fits (`GlobalValueCaster.toText`).

| Where the reference stands | What is sent |
| --- | --- |
| A JSON body field that holds nothing but the reference | The value with its own type: a number stays a number, a map stays a map |
| A URL path, a query parameter, a header, a form field, or inside longer text | The value as text |
| A connector field or a notification text | The value as text |

| Value is | As text |
| --- | --- |
| String | as is |
| Number, boolean | its literal: `42`, `3.5`, `true` |
| Array, map | compact JSON text: `["a","b"]`, `{"max":3}` |
| Null | empty string |

There is no cast to number, boolean, array or map, and so no cast error. An enhancement, `ref()` and a loop get the value with its own type; a loop over a value of a type it cannot walk fails the step.

## Scope

Each variable has one scope, and a workflow can use the variable only if the workflow falls inside it.

| Scope | Which workflows can use the variable |
| --- | --- |
| All workflows | Every workflow |
| Categories | Workflows that belong to one of the selected categories or to one of their subcategories. Workflows outside them cannot use it. |
| Workflows | Only the selected workflows |

Rules:

- Names are unique across the system, whatever the case. A reference holds the name as written, so a variable that is in use cannot be renamed (`IN_USE`).
- A method, operator, enhancement or field binding is checked against its own workflow.
- A connector is shared by workflows of any category, so it may only use variables with scope All workflows; any other variable is refused as `SCOPE_NOT_ALL`. A notification is checked against the workflow its schedule runs, and a notification template against every notification that sends it.

The backend checks scope at three moments and tells the user what is wrong:

1. **On save** of a workflow, connector, notification or notification template. The save is refused with a list of errors: code, variable, place of use.
2. **On execution start**, because scope can change after the save. The execution fails before its first step. The reason goes to the workflow's websocket channel and to the alert notifications of its schedule, not to the execution log.
3. **On a change that breaks existing usages**: deleting or renaming a variable, narrowing its scope, changing the parameters of a script that is called, or moving a workflow to another category. The change is refused with the list of usages.

## Permissions

The creator owns the variable and decides, per user, who may use, edit and delete it.

| Permission | Allows |
| --- | --- |
| Use | See the variable and its value, and reference it in workflows, connectors and notifications |
| Edit | Use, plus change name, description, value, script, parameters, scope and settings, and reset or restore the value |
| Delete | Use, plus delete the variable |
| Owner | Everything, plus manage the permissions of other users |

- A new variable is private to its owner until the owner grants permissions.
- Lists, the picker and the values endpoint return only variables the caller may use.
- Permissions are checked when a user adds a reference and saves. Executions do not check user permissions. They check existence and scope.
- A user without Use permission can keep references that are already in a workflow, but cannot add new ones. They see the variable's name, not its value.

## Usage as a reference

A global variable is a new reference type next to the existing ones, and the same resolver handles it everywhere a reference is allowed.

A global variable reference holds:

- the variable name, spelled exactly as it was saved;
- an optional path into the value;
- no arguments: a script variable is called in enhancement code, never inside a reference.

It is written `{{global.name}}`, optionally followed by a path into the value: `{{global.retryConfig.max}}`, `{{global.tenants[0].id}}`. `global` means the global variable store, and each dot after the name is a step into the value. A reference never holds a function call: `{{global.formatDate(order.date, "dd.MM")}}` is not valid syntax. Written with a backslash, `\{{global.name}}` is literal text: the backslash is dropped and nothing is resolved.

| Place of use | Read constant or mutable | Call script | Write mutable |
| --- | --- | --- | --- |
| Method: URL, headers, body | Yes | No | Yes, through `globalWrites` on the method |
| Operator: condition, loop source | Yes | No | No |
| Enhancement | Yes | Yes: imported as an arg, called in the code | Yes, with `set()` in JavaScript |
| Field binding | Yes, as source | Through its enhancement only | No: its target is always a method field |
| Connector: its request data fields | Yes | No | No |
| Notification template: subject, body | Yes | No | No |

Only a mutable variable can be a write target. A write to a constant or a script is an error.

## Runtime semantics

An execution validates and snapshots at start, then resolves each reference according to its kind.

1. If the workflow uses or owns a mutable variable and another execution of it is running, the new execution waits in a queue or is refused. The rule is described below.
2. Snapshot every variable in scope of the workflow, used or not: the values of the constants, the current values of the mutable variables as the run's own copy, and the definitions of the scripts. The snapshot is kept in memory only.
3. Check that each referenced variable exists and is in scope. On failure the execution fails before its first step.
4. During the run, read a constant from the snapshot, read a mutable variable live from storage, and run an enhancement that imports a script with the script's code from the snapshot, defined as a function before the enhancement's own code.
5. Persist a write to a mutable variable at once, with the time and the execution id. The values endpoint shows it on the next poll. When the run ends, the change log gets one `RUN_WRITE` entry per variable it wrote.
6. When the execution ends, free the workflow and start the next queued execution of it.

### One execution at a time

A workflow that uses a mutable variable runs one execution at a time. While an execution is running, its mutable variables are busy, and a second start of the same workflow follows the variable's busy policy.

| Busy policy | What happens to the second start |
| --- | --- |
| Queue (default) | The whole execution waits in a queue and starts when the running one ends. No step runs before that. |
| Refuse | The start is refused with 409 GLOBAL\_VARIABLE\_CONFLICT, code BUSY, which names the variable and the running execution. |

- The policy is set per mutable variable. If a workflow uses several mutable variables and one of them says Refuse, the start is refused.
- The queue is per workflow and first in, first out.
- A queued execution is checked and snapshotted when it leaves the queue, not when it enters. It gets the constants as they are at that moment.
- A variable becomes free when the running execution ends in any way: success, failure, cancel or timeout.
- The busy state and the queue are kept in memory. A restart frees every workflow; starts that were waiting are lost, and a schedule fires again at its next time.
- Limits, configurable: 100 waiting starts per workflow (`queue.max-waiting`) and 60 minutes of waiting (`queue.max-wait-minutes`). Past a limit the start is refused or dropped. A second start of the schedule that is running waits outside the queue, held by Quartz, until that run ends.
- A manual start refused on the call gets 409 `BUSY` and is not recorded. A webhook call refused on the call gets 409 `BUSY` too; such refusals, and cron fires skipped because a fire of the same schedule already waits, are counted and recorded once per schedule when the run ends, as one failed execution. Any other refused or dropped start is recorded as a failed execution of its schedule. The execution log holds the reason only with debug mode on, no notification is sent, and every recorded refusal goes to the workflow's websocket channel.
- Constants and scripts never make a workflow wait, because they cannot change during a run.
- Two different workflows that use the same mutable variable can still run at the same time. Only the owner workflow writes it; the others read it.

### Scripts

- A script runs inside the engine of the enhancement that imports it: Nashorn for JavaScript, without access to Java classes, files or the network. The time limit covers the whole enhancement, script calls included. Limit: 5 seconds, configurable (`script-timeout-ms`).
- Arguments and results are converted between JSON values and native types: JS object and array, Python dict and list, Ruby Hash and Array.
- A thrown error, a timeout, a call without a required parameter or a result of undefined fails the step. The error names the script and carries its message.
- Parsed sources are cached by variable id and version.

### Languages

- A script variable has a `language` field. JavaScript comes first, on Nashorn. Python and Ruby follow, through the polyglot service we already use.
- A script is imported only into an enhancement of its own language. In JavaScript it becomes a function of its declared parameters, and extra arguments reach it through `arguments`; Python and Ruby follow the same idea with `*extra`.
- Python means Python 3 (`python3`); `python2` is not supported. Python drops the "must return a value" rule: a function without `return` gives `None`, which is null. Ruby follows Ruby: a script returns its last expression, and `nil` is null. "Nothing returned" cannot be told apart from an intended null there, so it never fails the step.

## API

Everything is plain HTTP with JSON, and the UI gets current values by polling. The paths are the ones the backend serves, all under /global-variable. "Needs" names a component right of the role (upper case) or a right on the variable. A right on the variable also needs the component right: READ to read, UPDATE to change, restore or reset, DELETE to delete, and UPDATE or DELETE for the impact preview.

| Method and path | Purpose | Needs |
| --- | --- | --- |
| POST /global-variable | Create a variable | CREATE |
| GET /global-variable/all | List, paged. Filters: search (in name or description) and kind | READ; lists only the variables the user may use |
| GET /global-variable/{id} | Read one variable with its definition | Use |
| GET /global-variable/unique/{name} | Check that a name is free, ignoring case | READ |
| PUT /global-variable/{id} | Update. The body carries the version the form loaded | Edit |
| DELETE /global-variable/{id} | Delete. Refused while the variable is in use | Delete |
| POST /global-variable/{id}/impact | Tell what a change or a delete would block, before it is saved | Edit, or Delete for a delete |
| GET /global-variable/{id}/permissions | Read who may use, edit and delete the variable | Owner or admin, and READ |
| PUT /global-variable/{id}/permissions | Set per-user permissions | Owner or admin, and UPDATE |
| GET /global-variable/{id}/usage | List where the variable is used | Use |
| GET /global-variable/{id}/changes | Change log, newest first | Use |
| POST /global-variable/{id}/restore/{changeId} | Set the variable back to the value a change log entry saved | Edit |
| POST /global-variable/{id}/reset | Set a mutable variable back to its initial value | Edit |
| GET /global-variable/picker | Variables usable in one place (a workflow, a category, a connector or a notification), for the reference picker. A mutable variable names its owner workflow (ownerWorkflow) and is writable (writable) when the picker is opened for that saved workflow, so the globalWrites editor and set() offer only those | READ; lists only the variables the user may use |
| POST /global-variable/validate-script | Check a script as saving does and call it once with test arguments, without saving | CREATE or UPDATE |
| GET /global-variable/values | Current values of constants and mutable variables | READ; returns only the variables the user may use |

### Current values

- `GET /global-variable/values?ids=…` returns the listed variables, at most 100 per call. `?workflowId=…` returns every constant and mutable variable in scope of that workflow: the set the picker shows for it, so it includes variables open to all workflows that the workflow never references. A request gives one of the two; both, or neither, is a 400 error. An unknown workflow is a 404.
- Both forms return only the variables the user may view.
- Each item has id, version, revision, value, updatedAt, updatedBy and beingUpdatedBy. Items carry no name or kind; the UI already has them from the list or the detail.
  - version changes when a user saves the definition.
  - revision counts how often the current value of a mutable variable was set. It is 0 for a constant.
  - updatedBy is the user who set the value, or null when a run wrote it.
  - A secret's value is always null.
- For a mutable variable, beingUpdatedBy names the run of its owner workflow that holds it, as {workflowId, executionId, startedAt}, and is null when the variable is free. executionId can be null for a moment before the run's execution exists. A test run writes its own copy and does not count.
- Script variables have no stored value. With `workflowId` they are left out; a script listed in `ids` is a 400 error.
- The ETag is built from each item's id, version, revision and beingUpdatedBy. An unchanged poll answers 304 with no body; a save, a write, a reset, or a run starting or ending changes it.

### Errors

Errors come in three shapes, each with a top-level `error` and inner codes. The [API contract for the frontend](api-contract-for-frontend.md) lists every inner code.

| `error` | Status | Answers | Inner codes |
| --- | --- | --- | --- |
| `GLOBAL_REFERENCE_INVALID` | 400 | The save of a workflow, connector, notification or notification template | `violations[].code`: `UNKNOWN_VARIABLE`, `OUT_OF_SCOPE`, `SCOPE_NOT_ALL`, `NO_USE_PERMISSION`, `INVALID_WRITE_TARGET`, `NOT_MUTABLE`, `NOT_OWNER`, `SCRIPT_NOT_CALLABLE`, `IMPORT_LANGUAGE_MISMATCH`. Each names the `variable` and the `ref`, and `color` and `index` in a workflow or `field` elsewhere |
| `GLOBAL_VARIABLE_INVALID` | 400 | A request to the variable endpoints | `violations[].code` per request field, for example `NAME_TAKEN`, `SCOPE_REQUIRED`, `SECRET_NOT_ALLOWED`, `SCRIPT_SYNTAX`, `PARAMETER_INVALID` |
| `GLOBAL_VARIABLE_CONFLICT` | 409 | A change the variable's state refuses, or a start of a busy workflow | `code`: `VERSION_CONFLICT`, `IN_USE`, `SCOPE_NARROWING`, `PARAMETER_BREAKING` or `BUSY`, with `currentVersion` and a `blocking` list of usages, empty for `VERSION_CONFLICT` and `BUSY` |

403 and 404 use the plain `ErrorResource`. At run time a missing variable, a write that is not allowed and a failing script fail the step with a message that names the variable; there is no cast error, because values are only cast to text.

## Ordered TODO list

The work is 24 tasks in six phases, listed in dependency order. BE is backend. The frontend tasks T19 to T26 and T29 are with the UI developer and are not listed here, so the task numbers have gaps.

### Phase 0: Decisions

- [x] **T1** Confirm against the code every row marked "To check" in the table above.
- [x] **T2** Answer the open questions at the end of this spec. Questions 1 to 6 block the data model.

### Phase 1: Backend foundation

- [x] **T3** BE: Data model and migration. Variable (name, kind, description, value, current value, script language, source and parameters, busy policy, scope, owner, version), scope targets, permissions.
- [x] **T4** BE: Value service. JSON storage, type detection, size limit, and the autocast table with unit tests.
- [x] **T5** BE: CRUD endpoints with validation. Unique name, kind rules, kind fixed after creation, new version on each edit.
- [x] **T6** BE: Permissions. Owner, per-user Use, Edit and Delete, the permissions endpoint, enforcement in every endpoint.
- [x] **T7** BE: Scope. Scope model and the "in scope of this workflow" filter.

### Phase 2: References and validation

- [x] **T8** BE: New reference type in the reference model, parser and serializer, with a path. No arguments: a reference is a plain lookup.
- [x] **T9** BE: Where-used index, filled on save of workflows, connectors and notifications. Usages endpoint.
- [x] **T10** BE: Save-time validation of workflows, connectors and notifications. Exists, in scope, permission, read-only, where a script may be imported. Error codes.
- [x] **T11** BE: Refuse breaking changes. Delete, scope narrowing, parameter change, workflow moved to another category.

### Phase 3: Runtime

- [x] **T12** BE: Execution start. Collect references, check existence and scope, snapshot constants.
- [x] **T13** BE: One execution at a time. Busy check for workflows with a mutable variable, queue per workflow, Refuse policy, limits, release on every end, cleanup after a crash.
- [x] **T14** BE: Resolver for constants (from the snapshot) and mutable variables (live read), with path access and autocast.
- [x] **T15** BE: Mutable variable writes from a method's globalWrites and set() in JavaScript enhancements. Atomic replace, time and execution id, reset endpoint.
- [x] **T16** BE: Script variables in JS. Data and parameter model, save-time parse, import as an enhancement arg (//var VAR\_n = {{global.name}};), the script defined as a function before the enhancement code with defaults and extras, time limit, return check, result conversion, cache, script snapshot, validate-script endpoint.
- [x] **T17** BE: Resolution in connectors and notifications.
- [x] **T18** BE: Current-values endpoint with ETag and busy state.

### Phase 4: More languages

- [x] **T27** BE: Python script variables. Entry-function convention, value conversion, sandbox limits, return rule.
- [x] **T28** BE: Ruby script variables, same list as Python.

### Phase 5: Hardening

- [x] **T30** Tests. Concurrent mutable variable writes, constant snapshot during a running execution, queue order and release after a crash, scope and permission matrix, script limits.
- [x] **T31** If workflows can be exported and imported, carry global variable references across.
- [x] **T32** User documentation.
- [x] **T33** BE: One waiting start per schedule (open question 20). In `WorkflowRunGate.admitCronFire(...)`, a start fired by a schedule's cron trigger (a cron fire) is not queued when a cron fire of the same schedule already waits. The waiting fire keeps its place, and the extra fire does not run. Webhook starts, with or without data, and support-file starts are all kept as today.
  - Telling starts apart: `admit` gets the job key and the trigger's data, not the trigger. A cron fire, a manual start and a webhook start without data carry no trigger data, so the gate finds `ScheduleData` with `SCHEDULER` on the job for all three. Only the trigger differs: the `CronTrigger` keyed `<scheduleId>`, or a one-shot `FIRES_ONCE-…` trigger. As built, `ExecutionAspect.gateByMutableVariables` hands a start by a `CronTrigger` to `WorkflowRunGate.admitCronFire(connectionId, scheduleId, jobKey, triggerData)` and every other start to `admit`, and `Waiting` keeps the cron fire's schedule id.
  - Where fires pile up: `JobExecutor` is `@DisallowConcurrentExecution`, so a schedule's own cron fires wait in Quartz during its own run. The extra fires come from the workflow's other schedules while one schedule's run holds the workflow.
  - Limits: `queue.max-waiting` still applies to webhook starts, as built. Past it, a webhook start is refused on the call with 409 BUSY and counted for its schedule. The extra fire is checked before the limit, so a full queue never refuses it.
  - Decided: the extra fire is logged and counted, and its schedule gets one report when the run ends, in the same way as refused webhook starts. It is not recorded per fire. Today a refused or dropped start is logged, sent to the websocket channel and recorded by `ExecutionAspect.recordRefusedStart` as a failed execution. Done per fire, a schedule firing every minute adds a failed execution every minute.
  - Decided: a manual start is kept like a webhook start (`SchedulerServiceImp.startNow`, called by `SchedulerController.execute` and `startAll`). This needs no new marker, because the gate sees a manual start exactly as a webhook start without data.
  - Decided: the waiting fire takes the time of the newest extra fire. Otherwise a run longer than `queue.max-wait-minutes` would drop it at release, although its schedule fired moments before.
  - Tests: in `WorkflowRunGateTest`, a second cron fire of one schedule leaves `waitingCount` at 1; two schedules keep one waiting fire each; webhook starts with data are all kept, in order, up to the limit; a full queue does not refuse the extra fire; the waiting fire starts on release in its place. In `ExecutionAspectGateTest`, a cron trigger and a one-shot trigger reach the gate as different kinds. Add one test per decision above.

## Open questions

These 20 points need a decision. Where the spec already takes a position so that work can start, the question says "assumed". Questions 1 to 6 change the data model and need an answer first. Status on 23 November 2026: all 20 are decided.

1. Name of the second kind: decided as Mutable variable (MUTABLE in the code).
2. Mutable variable: one value shared by all executions (assumed), or does each execution start from the initial value? Decided as built: one value is shared by all executions. A run reads what the last run wrote, and only a reset returns it to the initial value.
3. Scope: can one variable list several categories or several workflows (assumed yes)? Can it mix categories and workflows (assumed no)? Decided as built: a variable lists several categories or several workflows, and never a mix of both.
4. Categories: are they nested, and can a workflow belong to several categories? Decided as built: categories are nested and a workflow has exactly one category. A variable scoped to a category also reaches the workflows of its subcategories.
5. Permissions: per user only (assumed), or also per group or role? Does an administrator see every variable? Decided: grants are per user only in the first version, and an administrator holds every permission on every variable. OpenCelium has roles but no user groups.
6. Calling a script variable: decided. Enhancement args import it as `//var VAR_n = {{global.name}};`, and the code calls `VAR_n(...)`. A reference never holds a call, so `{{global.fn(a, b)}}` is not supported. Extra arguments reach the function through `arguments`.
7. The story says workflows outside a category "can" use a category-scoped variable. The spec reads this as "cannot". Correct? Decided: "cannot", as built. A workflow outside the category, or without a category, cannot use the variable.
8. Shared connectors and notifications: checked against every workflow that uses them (assumed), or limited to variables with scope All workflows? Decided as built: a connector may only use variables with scope All workflows, and a notification is checked against the workflow its schedule runs. The Scope section states this rule.
9. Two different workflows can run at the same time with the same mutable variable. Decided: only its owner workflow writes it, so the last-write-wins case does not arise. The busy check covers runs of the same workflow only.
10. Writing a mutable variable: decided. A method writes through `globalWrites` (`"global.name": value`, without braces), and a JavaScript enhancement through `set("{{global.name}}", value)`. A field binding's `from` and `to` stay method references, and there is no separate "set variable" step.
11. Script return value: decided. In JavaScript null is a valid result and undefined fails the step. In Python, code that ends without return gives None, which is null, as return None does; the step does not fail. In Ruby, a script returns its last expression, and nil is null.
12. Can a script read other global variables directly, or only through its arguments (assumed)? Decided as built: only through its arguments. A JavaScript script that calls `ref()` or `set()` is refused as `SCRIPT_NOT_PURE`. Python and Ruby code is not checked for this on save.
13. Breaking changes while a variable is in use: always refused (assumed), or allowed with a force option? Decided as built: always refused, with the list of usages, and there is no force option. The codes are `IN_USE`, `SCOPE_NARROWING` and `PARAMETER_BREAKING`.
14. A user without Use permission edits a workflow: keep the existing references (assumed), or refuse the save? Decided as built: the existing references are kept. The user cannot add the variable to a workflow, connector or notification that does not use it yet (`NO_USE_PERMISSION`).
15. Are secret values needed, for example an API key that is masked in the UI and in the values endpoint? Decided as built: yes, for constants. The value is encrypted in the database and the values endpoint returns null for it. A mutable or script variable cannot be a secret. Each installation must set its own `secret-key`, because the default key is public in the source code.
16. Limits: 1 MB per value, 5 seconds per script call, 5 seconds polling interval. Accept or change? Decided as built: 64 KB per value (`max-value-bytes: 65536`, configurable) instead of 1 MB, and 5 seconds per script call (`script-timeout-ms`). The polling interval is a frontend setting; the values endpoint supports it with ETag and 304.
17. A missing path inside a value: null (assumed), or an error? Decided as built: null. A missing key, or an index past the end of an array, resolves to null; only a missing variable is an error.
18. Busy policy: chosen per mutable variable between Queue and Refuse (assumed), or one fixed behaviour for the whole system? Decided as built: per mutable variable, Queue by default. When a workflow uses several, one variable with Refuse is enough to refuse the start.
19. One execution at a time: only for workflows that use a mutable variable (assumed), or also for workflows that use only constants or scripts? Decided as built: only for workflows that use a mutable variable, which includes a workflow that only reads one. A workflow with only constants or scripts runs in parallel as before.
20. Queue limits: 100 waiting executions and 1 hour of waiting per workflow (proposed). Should a scheduled workflow keep only one waiting execution instead of one per trigger? Decided: the limits are 100 waiting starts and 60 minutes, both configurable (`queue.max-waiting`, `queue.max-wait-minutes`), as built. A scheduled workflow keeps at most one waiting start per schedule, and every webhook start is kept because each carries its own data. This is built (task T33): while a cron fire of a schedule waits, further cron fires of that schedule are skipped and reported once when the run ends.
