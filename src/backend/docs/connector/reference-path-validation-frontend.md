# Reference / JSON path validation API — frontend integration guide

Audience: frontend developers. Lets the editor check a reference, and above all the JSON path in
it, **while the user writes it**, and show what is wrong and how to fix it. Without it, a broken
path only shows up when the connection runs.

Base path: `/connection` (same origin and JWT auth as every other API; standard
`Authorization: Bearer <token>` header).

**TL;DR**

1. When the user confirms (or pauses typing) a path in the reference generator, build the full
   reference as today (`buildReferenceValue`) and `POST /connection/reference/validate` with it.
2. `valid: false` → block saving the reference and show `errors`. `warnings` never block; show
   them as hints.
3. Every issue has a `position` in the reference string: underline from there. Show `message`, and
   `hint` as the suggested fix.
4. Optional: send the method's example response as `sample` to also catch typos in field names
   ("did you mean 'data'?").

Nothing is saved, no API is called. The call is fast and synchronous; debounce it (~300 ms) if you
validate while typing.

---

## POST /connection/reference/validate

```
POST /connection/reference/validate
Content-Type: application/json
```

```json
{
  "reference": "#ababab.(response).body.$.dat[0].id",
  "iterators": ["i"],
  "sample": { "data": [ { "id": 1, "Name": "a" } ] }
}
```

| Field | Required | Meaning |
|---|---|---|
| `reference` | yes | the full reference, exactly as it will be stored: `#ababab.(response).body.$.data[*].id`, `{%#ababab.(request).body.$.id%}`, `${order.id:integer}`, `{token}`, `@{offset}`, … |
| `iterators` | no | the loop iterators visible where the reference is used, e.g. `["i", "j"]`. **Omit it (or send `null`) when you don't know**: iterators are then not checked. Send `[]` when the reference is not inside any loop: `[i]` is then reported as an error. |
| `sample` | no | an example of the JSON the path is read from: the method's example response/request body, or the webhook variables for a `${…}` reference. A JSON value or a JSON string. Used for **body** and **webhook** paths only. |

### 200 OK — always, valid or not

The endpoint answers `200` for any reference, even a broken one. Only a missing or non-JSON
request body gives `400`.

```json
{
  "valid": true,
  "reference": "#ababab.(response).body.$.dat[0].id",
  "type": "DIRECT",
  "part": "BODY",
  "path": "dat[0].id",
  "sampleMatched": false,
  "errors": [],
  "warnings": [
    {
      "code": "PATH_NOT_IN_SAMPLE",
      "message": "Field 'dat' does not exist in the root of the sample.",
      "hint": "Did you mean 'data'?",
      "position": 26,
      "fragment": "dat"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `valid` | `true` when `errors` is empty: the reference parses and its path compiles. Warnings never make it invalid. |
| `reference` | the reference as received |
| `type` | `DIRECT`, `WRAPPED_DIRECT`, `WEBHOOK`, `ENHANCEMENT`, `PAGE`, `REQUEST_DATA`, or `null` when it is not recognised |
| `part` | for (wrapped) direct references: `BODY`, `HEADER`, `STATUS` or `ALL` (`[*]`); otherwise `null` |
| `path` | the path after `.$.` (body/header), after `[*].`, or inside `${…}`; `""` for the whole body; `null` when there is none |
| `sampleMatched` | `true` the path was found in the sample · `false` it was not (see `warnings`) · `null` no sample given, the path could not be checked (syntax errors, `..`), or an empty array in the sample stopped the check |
| `errors[]` | problems that make the reference fail when the connection runs |
| `warnings[]` | things that work but are probably a mistake, and everything found by comparing with the sample |

Each issue:

| Field | Meaning |
|---|---|
| `code` | stable identifier, use it for translations (table below) |
| `message` | what is wrong (English) |
| `hint` | how to fix it (English), often with the corrected text; may be `null` |
| `position` | 0-based index in `reference` where the problem starts; `null` when it is about the whole reference. It can equal `reference.length` (something is missing at the end). |
| `fragment` | the text at `position` the issue is about; may be `null` |

Since the frontend adds `#color.(response).body.$.` itself, subtract the prefix length from
`position` to underline inside the path input the user typed.

---

## Why a sample finding is only a warning

An example response can be incomplete (optional fields, empty arrays), so a path missing from it is
not necessarily wrong. Show these warnings prominently, but let the user keep the path.

---

## Issue codes

### Errors — the reference fails at execution

| Code | Example input | Hint returned (abridged) |
|---|---|---|
| `REFERENCE_REQUIRED` | `""` | pick a method and write a path |
| `SURROUNDING_WHITESPACE` | `" #ababab.(response).status"` | remove the spaces |
| `UNKNOWN_REFERENCE` | `hello` | how references start |
| `INVALID_REFERENCE` | `{#ab.token}`, `@{foo}` | message of the parser, e.g. the allowed pagination params |
| `UNCLOSED_WRAPPER` | `{%#ababab…`, `${order` | add `%}` / `}` |
| `INVALID_COLOR` | `#abab.(response)…` | `#` + 6 letters or digits |
| `INVALID_EXCHANGE_TYPE` | `#ababab.(responce)…` | `.(response)` or `.(request)` |
| `PART_REQUIRED` | `#ababab.(response)` | `.status`, `.header.$.<name>`, `.body.$.<path>`, `.[*]` |
| `INVALID_PART` | `….bodyX.$.a` | same as above |
| `STATUS_HAS_PATH` | `….status.$.x` | end after `.status` |
| `MISSING_ROOT` | `….body.data` | `Write body.$.data.` |
| `MISSING_DOT_AFTER_ROOT` | `….body.$[0]` | `Write body.$.[0] instead of body.$[0].` |
| `PATH_REQUIRED` | `${}` | write the variable name |
| `TRAILING_DOT` | `….$.data.` | remove the final `.` |
| `UNCLOSED_BRACKET` | `data[0` | add `]` |
| `UNEXPECTED_CLOSING_BRACKET` | `data0]` | remove `]` or add `[` |
| `UNCLOSED_QUOTE` | `a['name]` | close the quote |
| `QUOTE_OUTSIDE_BRACKETS` | `'name'` | `['name']` or `name` |
| `EMPTY_FIELD_NAME` | `a['']` | write a name between the quotes |
| `INVALID_BRACKET_CONTENT` | `data[abc]`, `data[ 0 ]`, `data[I]` | `[0]`, `[*]`, `[i]` or `['abc']` |
| `INVALID_FILTER` | `data[?(@.id > 0]` | close the filter with `)` |
| `UNKNOWN_ITERATOR` | `data[i]` with `iterators: []` | not in a loop: `[0]` or `[*]`; or the iterators in scope |
| `MISSING_DOT` | `data[0]name` | add `.` between `]` and `name` |
| `INVALID_TILDE` | `items~` | `~` only after `['k']` (for-in key) or `[i]` (split string) |
| `TILDE_NOT_LAST` | `items['k']~.x` | `~` must be last |
| `INVALID_JSON_PATH` | anything the JSON path engine still rejects | message of the engine |
| `HEADER_NAME_REQUIRED` | `….header`, `….header.$.[0]` | e.g. `header.$.Content-Type` |
| `INVALID_HEADER_NAME` | `….header.$.Bad Header` | no spaces / allowed characters |
| `INVALID_HEADER_SELECTOR` | `Set-Cookie['Max-Age']` | `[0]`, `[*]` or `["attribute"]` (double quotes) |
| `UNKNOWN_DATA_TYPE` | `${order.id:int}` | `string, number, integer, boolean, array, object, undefined` |

### Warnings — works, but check it

| Code | Example | Meaning |
|---|---|---|
| `DEEP_SCAN` | `$..id` | `..` searches the whole document; usually a typo for `.` |
| `DUPLICATE_ROOT` | `body.$.$.data`, `${$.order}` | `$` in the middle is read as a field named `$` |
| `EMPTY_BRACKETS` | `data[]` | read as `[*]` |
| `FIELD_WHITESPACE` | `data. id` | the space is part of the field name |
| `UNEXPECTED_PATH_AFTER_ALL` | `….[*].foo` | after `[*]` only `status`, `header`, `body` |

### Warnings from the sample (`sampleMatched` is `false` or `null`)

| Code | Example (sample `{"data":[{"id":1,"Name":"a"}]}`) | Hint |
|---|---|---|
| `PATH_NOT_IN_SAMPLE` | `dat[0].id` | `Did you mean 'data'?` |
| | `data[0].name` | `Did you mean 'Name'? Field names are case-sensitive.` |
| | no close match | `Available fields: a, b, c.` (first 10) |
| `FIELD_ON_ARRAY` | `data.id` | `Pick items first: data[*].id for all items, data[0].id for the first one, or data[i].id inside a loop.` |
| `NOT_AN_ARRAY` | `data[0].id[0]` | the value is not an array; read a field or remove the index |
| `INDEX_OUT_OF_RANGE` | `data[5]` | `Use an index from 0 to 0, or -1 for the last item.` |
| `EMPTY_ARRAY_IN_SAMPLE` | `empty[*].x` | the rest could not be checked (`sampleMatched: null`) |
| `NO_MATCH_IN_SAMPLE` | filter/slice matching nothing | check the filter against the sample |
| `INVALID_SAMPLE` | `"sample": "not json"` | the sample was ignored |

---

## Path syntax accepted (body and webhook)

The same syntax the execution reads:

| Write | Meaning |
|---|---|
| `data.id` | field of a field |
| `data[0]`, `data[-1]` | item by index; `-1` is the last |
| `data[*]` | all items |
| `data[i]` | item of the current loop iteration (`i` = loop iterator, lowercase letter) |
| `obj['field name']`, `obj["x"]` | field with spaces or special characters |
| `obj['i']` | value of the current for-in key (`i` = for-in iterator) |
| `obj['k']~` | the for-in key itself (only at the end) |
| `text[i]~`, `text[2]~`, `text[*]~` | split-string part (only at the end) |
| `data[?(@.id > 0)]`, `data[0:2]`, `data[0,1]` | JSON path filters, slices and unions |

Header paths: `Content-Type`, `Set-Cookie[0]`, `Set-Cookie[*]`, `Set-Cookie["Max-Age"]`.

Note: a field name of a single letter in quotes (`['a']`) is read as a for-in iterator by the
execution, so with `iterators` given it is reported as `UNKNOWN_ITERATOR` when no such loop exists.

---

## Examples

**Path on an array without an index**

```json
{ "reference": "#ababab.(response).body.$.data.id",
  "sample": { "data": [ { "id": 1 } ] } }
```
→ `valid: true`, `sampleMatched: false`, warning `FIELD_ON_ARRAY` at `position` 31
(`fragment: "id"`), hint `Pick items first: data[*].id …`.

**Iterator outside a loop**

```json
{ "reference": "#ababab.(response).body.$.data[i].id", "iterators": [] }
```
→ `valid: false`, error `UNKNOWN_ITERATOR` at `position` 31, `fragment: "[i]"`.

**Missing `$.`**

```json
{ "reference": "#ababab.(response).body.data" }
```
→ `valid: false`, error `MISSING_ROOT` at `position` 24, hint `Write body.$.data.`

**Webhook with a wrong type**

```json
{ "reference": "${order.id:int}" }
```
→ `valid: false`, error `UNKNOWN_DATA_TYPE` at `position` 11, `fragment: "int"`.

---

## Error responses

| Status | When |
|---|---|
| `400` | the body is missing or not JSON |
| `401` | no or expired token |
| `500` | unexpected server error (`ErrorResource`) |
