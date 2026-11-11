# Enhancement script test run — frontend integration guide

Audience: frontend developers. Lets the user run the JavaScript of an enhancement with test
values for its variables and see the result, before the connection is saved or run.

Base path: `/lang-code` (same origin and JWT auth as every other API; standard
`Authorization: Bearer <token>` header).

**TL;DR**

1. Show an input for each variable of the enhancement (`enhancement.args` keys, without
   `RESULT_VAR`) and let the user enter a value.
2. `POST /lang-code/execute` with the script and `{ variableName: value }`.
3. `success: true` → show `result` (and `output`, if any).
   `success: false` → show `error`: mark `line` in the editor, show `hint` and `message`.

A failing script is **not** an HTTP error: the response is `200` with `success: false`.
Non-2xx responses mean the request itself was wrong (empty script, bad variable name, …) or
the server is busy.

Nothing is saved, and the script runs in a sandbox: it cannot reach Java classes, load other
code or stop the server.

See also [script-validation-frontend.md](script-validation-frontend.md) for syntax checking only.

---

## POST /lang-code/execute

```
POST /lang-code/execute
Content-Type: application/json
```

```json
{
  "language": "js",
  "script": "RESULT_VAR = VAR_0 + VAR_1.id",
  "variables": {
    "VAR_0": 10,
    "VAR_1": { "id": 7 }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `language` | no | language code of the enhancement (`EnhancementDTO.language`). Only `js` can be run. Empty or missing means `js`. |
| `script` | yes | the source code exactly as typed (`EnhancementDTO.script`). Max 100 000 characters. |
| `variables` | no | one entry per variable the script reads. Keys are the variable names (the keys of `enhancement.args`, e.g. `VAR_0`); values are any JSON value: string, number, boolean, object, array or `null`. Max 1 MB as JSON. |

About the variables:

- **Send real JSON types.** `10` is a number in the script, `"10"` a string. An object or array
  arrives as a JavaScript object or array, already parsed: the script uses `VAR_1.id` directly,
  without `JSON.parse`.
- **`RESULT_VAR` is ignored** if sent. A real execution doesn't inject it either: the script
  assigns it (`RESULT_VAR = …`), and the assigned value becomes the result.
- Names must be valid JavaScript identifiers (letters, digits, `_`, `$`; not starting with a
  digit) and not reserved words (`var`, `null`, `undefined`, …).
- A variable the script uses but that is missing from `variables` fails the run with a
  `ReferenceError`; one that is sent but not used is harmless.

**200 OK: script ran**

```json
{
  "success": true,
  "language": "js",
  "result": 17.0,
  "resultType": "number",
  "output": "",
  "durationMs": 14,
  "error": null
}
```

| Field | Meaning |
|---|---|
| `success` | `true` when the script ran and produced a result |
| `result` | **the value a real execution would use**: the value of the script's last expression. For `RESULT_VAR = …` that is the assigned value. Any JSON value. |
| `resultType` | `string`, `number`, `boolean`, `object`, `array` or `null` |
| `output` | text the script wrote with `print(...)`, one line per call. Max 64 KB; longer output is cut and ends with `[output truncated at 65536 characters]`. Useful for debugging. |
| `durationMs` | how long the run took |
| `error` | `null` on success |

Things to know about `result`:

- Numbers may come back as `17.0` rather than `17`: Nashorn computes in doubles. In JSON both
  parse to the same number.
- A script that ends with a statement rather than an expression (e.g. `var x = 1;`) has
  `result: null`, `resultType: "null"`, with `success: true`.

**200 OK: script failed**

```json
{
  "success": false,
  "language": "js",
  "result": null,
  "resultType": null,
  "output": "",
  "durationMs": 3,
  "error": {
    "type": "RUNTIME",
    "name": "ReferenceError",
    "line": 1,
    "column": null,
    "message": "\"VAR_2\" is not defined",
    "codeLine": "RESULT_VAR = VAR_0 + VAR_2",
    "hint": "'VAR_2' is not defined: it is neither declared in the script nor one of the provided variables. Add a value for it to the variables, declare it with var, or check the spelling."
  }
}
```

`output` is still filled on failure, with whatever was printed before the script failed.

| Field | Meaning |
|---|---|
| `error.type` | where it failed — see below |
| `error.name` | JavaScript error name: `SyntaxError`, `ReferenceError`, `TypeError`, `RangeError`, `URIError`, `Error`, or `null` (e.g. `throw 'text'`, a timeout) |
| `error.line` | **1-based** line, or `null` when unknown |
| `error.column` | **1-based** column. Only syntax errors have one; runtime errors give `null`. |
| `error.message` | the engine's message, without the `<eval>` position text |
| `error.codeLine` | the line of `script` the error is on, or `null` |
| `error.hint` | what the user should change, in plain English. Always present. |

| `error.type` | When | Has `line` |
|---|---|---|
| `SYNTAX` | the script does not compile. Same check, message and hints as `/lang-code/validate`, including the ES5.1 hints (`let`, arrow functions, template literals, …). The script did not run. | yes, with column |
| `RUNTIME` | the script threw while running | yes, usually |
| `TIMEOUT` | the script ran longer than 5 seconds (an endless loop) and was stopped | no |
| `RESULT` | the script ended with something that is not JSON: a function, a `Date`, … | no |

### Common runtime hints

| Script / situation | `message` | `hint` starts with |
|---|---|---|
| uses `VAR_2`, which is not in `variables` | `"VAR_2" is not defined` | 'VAR_2' is not defined: it is neither declared … nor one of the provided variables |
| `VAR_0.customer.name` where `customer` is missing | `Cannot read property "name" from undefined` | The value whose 'name' is accessed is undefined |
| `a.x = 1` with `a` null | `Cannot set property "x" of null` | The value whose 'x' is accessed is null |
| `VAR_0.includes('a')` | `"abc".includes is not a function` | … is not a function. Check the spelling, and that the method exists in JavaScript ES5.1 |
| `JSON.parse(VAR_1)` with an object variable | `Invalid JSON: …` | JSON.parse got text that is not valid JSON. Variables with object or array values are already parsed |
| `throw new Error('no id')` | `no id` | The script threw this error itself |
| `while (true) {}` | `Script did not finish within 5000 ms` | The script ran too long. Look for a loop that never ends |
| ends with `(function () {})` or `new Date()` | `Cannot read a result of nashorn: …` | End the script with a string, number, boolean, null, plain object or array |

Don't match on hint texts in code; they may be reworded. Use `success`, `error.type` and
`error.line` for logic and display `hint` / `message` as text.

---

## Errors

Returned as the usual `ErrorResource`:

```json
{
  "timestamp": "2026-11-11T10:15:30.000+00:00",
  "status": 400,
  "error": "INVALID_VARIABLE_NAME",
  "message": "'my var' is not a valid JavaScript variable name",
  "path": null
}
```

| Status | `error` | When |
|---|---|---|
| 400 | `SCRIPT_IS_EMPTY` | `script` is missing, empty or only whitespace |
| 400 | `SCRIPT_TOO_LARGE` | `script` is longer than 100 000 characters |
| 400 | `UNSUPPORTED_LANGUAGE` | `language` is anything other than `js`. Don't offer a test run for Python/Ruby enhancements. |
| 400 | `INVALID_VARIABLE_NAME` | a key of `variables` is not a valid JavaScript identifier or is a reserved word |
| 400 | `VARIABLES_TOO_LARGE` | `variables` is larger than 1 MB as JSON |
| 429 | `TOO_MANY_SCRIPT_RUNS` | two scripts are already running on the server. Ask the user to try again in a moment. |
| 503 | `SCRIPT_ENGINE_UNAVAILABLE`, `SCRIPT_RUN_INTERRUPTED` | the server could not run the script |
| 401 | | missing or expired token |

---

## Differences from a real execution

The script runs with the same engine and the same conversion of variables and result as in a
connection execution, so the same script and values give the same `result`. Differences:

- **Sandbox.** `Java.type(...)`, `java.*`, `Packages`, `load`, `quit` and `exit` don't exist
  here and fail with a `ReferenceError`.
- **Time limit.** 5 seconds here.
- **Values.** Here the user types the values; in an execution they come from the referenced
  method data (`#color.(response).path`). Test with realistic data, e.g. a copy of a real
  response body.

---

## Suggested UI

- A "Run" button next to the script editor, with one input per variable. A JSON editor works
  best for object/array values; parse it on the frontend and send the parsed value.
- Prefill variables from the last run, so the user can tweak the script and rerun quickly.
- Disable the button while a run is in flight (a run takes up to 5 seconds); on `429`, show
  "busy, try again".
- On `success: true`: show `result` pretty-printed with its `resultType`, and `output` if
  not empty.
- On `success: false`: show `hint` as the main text and `message` as details, mark `line` in
  the editor (gutter icon), and show `output` if not empty.
