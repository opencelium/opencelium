# Enhancement script validation — frontend integration guide

Audience: frontend developers. Lets the user check the JavaScript of an enhancement while
typing it, before the connection is saved or run.

Base path: `/lang-code` (same origin and JWT auth as every other API; standard
`Authorization: Bearer <token>` header).

**TL;DR**

1. `POST /lang-code/validate` with `{ "language": "js", "script": "<code>" }`.
2. `valid: true` → the script is fine.
3. `valid: false` → show `errors[0]`: mark `line` / `column` in the editor, show `message`
   and, more prominently, `hint` (what to change).

An invalid script is **not** an HTTP error: the response is `200` with `valid: false`. Non-2xx
responses mean the request itself was wrong (empty script, unsupported language, …).

The script is only **compiled, never run**: nothing is executed on the server and nothing is
saved.

---

## POST /lang-code/validate

```
POST /lang-code/validate
Content-Type: application/json
```

```json
{
  "language": "js",
  "script": "var a = 1;\nvar b = a +;"
}
```

| Field | Required | Meaning |
|---|---|---|
| `language` | no | language code of the enhancement (`EnhancementDTO.language`). Only `js` can be checked. Empty or missing means `js`. |
| `script` | yes | the source code exactly as typed (`EnhancementDTO.script`). Max 100 000 characters. |

**200 OK: script is valid**

```json
{
  "valid": true,
  "language": "js",
  "errors": []
}
```

**200 OK: script is invalid**

```json
{
  "valid": false,
  "language": "js",
  "errors": [
    {
      "line": 2,
      "column": 12,
      "message": "Expected an operand but found ;",
      "codeLine": "var b = a +;",
      "hint": "A value is missing before ';'. Check for a dangling or doubled operator (+, -, =, &&) or an extra comma."
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `valid` | `true` when the engine accepted the script |
| `language` | the language the script was checked against (`js`) |
| `errors` | empty when valid. Always a list, but the JS engine stops at the **first** error, so today it holds at most one entry. Fix it and check again to find the next one. |
| `errors[].line` | **1-based** line of the error. Can be `null` when the engine gives no position. |
| `errors[].column` | **1-based** column of the error, i.e. the position of the character the engine stumbled on. Can be `null`. |
| `errors[].message` | the engine's own message, cleaned of its `<eval>:L:C` prefix. Technical; good as secondary text. |
| `errors[].codeLine` | the line of `script` the error is on. Empty string when the error is at the very end of the script (e.g. a missing `}`), `null` when the position is unknown. |
| `errors[].hint` | what the user should change, in plain English. Always present. |

Line and column count from 1, as most editors (CodeMirror, Monaco) display them. Lines are split
on `\n`, `\r\n` and `\r`.

---

## Errors

Returned as the usual `ErrorResource`:

```json
{
  "timestamp": "2026-11-11T10:15:30.000+00:00",
  "status": 400,
  "error": "SCRIPT_IS_EMPTY",
  "message": "Script must not be empty",
  "path": null
}
```

| Status | `error` | When |
|---|---|---|
| 400 | `SCRIPT_IS_EMPTY` | `script` is missing, empty or only whitespace. Easiest to not call the endpoint at all in that case. |
| 400 | `SCRIPT_TOO_LARGE` | `script` is longer than 100 000 characters |
| 400 | `UNSUPPORTED_LANGUAGE` | `language` is anything other than `js` (e.g. `python3`, `ruby`). Python/Ruby run on the polyglot service, which cannot check syntax yet. Don't call the endpoint for those languages. |
| 503 | `SCRIPT_ENGINE_UNAVAILABLE` | no JS engine is available on the server (should not happen) |
| 401 | | missing or expired token |

---

## What is and isn't checked

Checked: **syntax** — the same compile step that runs before an enhancement is executed. A
script that passes here will not fail at execution with a syntax error.

Not checked, because the script is not run:

- undefined variables or properties (`x.y.z()` passes even if `x` doesn't exist)
- wrong types, wrong results, infinite loops
- whether the variables match the enhancement's `args`

The arguments of the enhancement are injected as variables when it runs, so referring to them
in the script is fine; they don't need to be declared.

### JavaScript version: ES5.1

Enhancements run on Nashorn, which supports **ES5.1**. Modern syntax is a syntax error there,
and the engine's message for it is cryptic (`let x = 1;` gives "Expected ; but found x"). The
`hint` names the feature and the ES5 alternative:

| User wrote | `hint` starts with | Suggested alternative |
|---|---|---|
| `` `Hello ${name}` `` | Template literals cannot be used | `'Hello ' + name` |
| `x => x * 2`, `() => 1` | Arrow functions cannot be used | `function (x) { return x * 2; }` |
| `let x = 1;` | 'let' declarations cannot be used | `var x = 1;` |
| `async function f()`, `await` | 'async' and 'await' cannot be used | a regular function |
| `class A {}` | Classes cannot be used | constructor function + prototype |
| `[...a]`, `f(...args)` | Spread and rest syntax (...) cannot be used | `a.concat(...)`, `f.apply(null, args)` |
| `for (var x of arr)` | 'for...of' loops cannot be used | classic `for` or `arr.forEach(function (x) { ... })` |
| `var {a} = obj;` | Destructuring cannot be used | `var a = obj.a;` |
| `function f(a = 1)` | Default parameter values cannot be used | `if (a === undefined) { a = 1; }` |
| `a?.b` | Optional chaining (?.) cannot be used | `a && a.b` |
| `2 ** 3` | The ** operator cannot be used | `Math.pow(2, 3)` |

`const` is accepted.

### Other common hints

| User wrote | `hint` |
|---|---|
| `return x;` at top level | 'return' is only allowed inside a function. Remove it (the value of the last expression in the script is the result) or wrap the code in `(function () { ... })();` |
| `var s = 'abc;` | A string is not closed. Add the matching quote on the same line; … |
| `function f() {` … (never closed) | The script ends before every bracket is closed. Add the missing '}'. |
| `if (a) { b; }}` | '}' has no matching opening bracket. Remove it or add the missing opening bracket. |
| `{a: 1 b: 2}` | Elements of an array or object must be separated by commas. Add ',' before a name. |
| `foo(1, 2;` | Arguments must be separated by commas and the list closed with ')'. Add ',' or ')' before ';'. |
| `var b = a +;` | A value is missing before ';'. Check for a dangling or doubled operator (+, -, =, &&) or an extra comma. |

Anything not recognized gets a general hint ("Check the syntax at the reported line and
column: …"), so always show `message` alongside it.

Don't match on hint texts in code — they may be reworded. Use `valid`, `line` and `column` for
logic and display `message` / `hint` as text.

---

## Suggested UI

- Validate **debounced** while typing (e.g. 500 ms after the last keystroke) or on blur /
  "Check" button. Skip the call while the script is blank.
- Ignore a response that arrives after the script has changed again (compare with the script
  you sent, or cancel the previous request).
- On `valid: false`: put a marker at `line`/`column` (gutter icon + squiggle), show `hint` as
  the main text and `message` as details.
- On `valid: true`: clear markers.
- The check is advisory: the connection can still be saved with an invalid script. It will fail
  when the enhancement runs.
