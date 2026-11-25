# Single-method test API — frontend integration guide

Audience: frontend developers. Lets a user test **one method** of a workflow from the editor,
against the real API, without running the whole connection.

Base path: `/connection` (same origin and JWT auth as every other API; standard
`Authorization: Bearer <token>` header).

**TL;DR**

1. `POST /connection/method/test/refs` with the method → the list of references it uses, split
   into those the backend fills in from the connector or a global variable and those the user
   must give a value for.
2. Show an input for each reference that needs a value.
3. `POST /connection/method/test` with the method and those values → the request that was sent
   and the API's response.

Nothing is saved: no connection, no scheduler, no execution log, no websocket. The call is
synchronous: the response arrives when the API has answered.

---

## Where the values come from

A method can reference data it does not have during a single-method test. The backend splits
references into two groups:

| Reference | Example | In a test |
|---|---|---|
| Connector field of the method's connector | `{url}`, `{token}` | **filled in by the backend** from the connector (credentials, auth token) |
| Connector field of another connector | `{#12.apiKey}` | **filled in by the backend** from connector 12 |
| Another method's data | `#c0ffee.(response).id` | **static value from the user** |
| Another method's data inside text | `{%#c0ffee.(response).id%}` | **static value from the user** |
| Webhook variable | `${orderId}`, `${orderId:int}` | **static value from the user** |
| Field-binding script result | `#{%65f1c2…%}` | **static value from the user** |
| Pagination parameter | `@{offset}` | **static value from the user** |
| Global variable the user may use in the method's workflow | `{{global.shopUrl}}`, `{{global.tenants[0].id}}` | **filled in by the backend** with the variable's current value |
| Any other global variable, or one with a loop iterator in its path | `{{global.tenants[i].id}}` | **static value from the user** |

Filling in connector fields can itself call the API, e.g. to obtain an auth token, exactly like
a real connection run does.

A `{key}` in a pure HTTP request (a method without a connector) has no connector to read from,
so it needs a static value too. `/refs` already puts it in the right group.

### The method's workflow: `connectionId` / `categoryId`

All three endpoints take two optional query parameters, the same as the global variable picker
(`GET /global-variable/picker`). They decide which global variables the backend fills in:

| Query | When | Global variables filled in |
|---|---|---|
| `?connectionId=42` | the workflow is saved | those in the scope of workflow 42 |
| `?categoryId=7` | the workflow is not saved yet | those its category 7 reaches |
| neither | no workflow | only those open to all workflows |

Both together → `400 METHOD_TEST_WORKFLOW_AMBIGUOUS`. Send the same parameters to `/refs`,
`/test` and `/curl`. Only variables the user may view and use (owner, granted, or admin, with
the role's global variable READ permission, as for the picker) are filled in, because their value
is shown in the sent request; any other global variable stays a static reference. A
`{{global…}}` whose path names a loop iterator (`[i]`, `['k']`) has no value outside a run, so it
needs a static value too.

---

## POST /connection/method/test/refs

Lists the references of a method. Sends no request to any API.

```
POST /connection/method/test/refs?connectionId=42
Content-Type: application/json
```

The body is **the method object itself**, the same JSON the editor keeps for an item of
`fromConnector.methods` in a connection. The method does not need to be saved.

```json
{
  "color": "#ababab",
  "name": "GetOrders",
  "request": {
    "endpoint": "{url}/orders?status=${status}&limit={{global.pageSize}}",
    "method": "GET",
    "header": { "Authorization": "Bearer {token}" },
    "body": null
  },
  "connector": { "connectorId": 3, "title": "Shop", "invoker": "Shop" }
}
```

**200 OK**

```json
{
  "connectorReferences": [
    { "reference": "{token}", "connectorId": 3, "key": "token", "available": true },
    { "reference": "{url}",   "connectorId": 3, "key": "url",   "available": true }
  ],
  "staticReferences": [
    { "reference": "${status}", "type": "WEBHOOK" }
  ],
  "globalReferences": [
    { "reference": "{{global.pageSize}}", "name": "pageSize" }
  ]
}
```

| Field | Meaning |
|---|---|
| `connectorReferences[].reference` | the reference exactly as written in the method |
| `connectorReferences[].connectorId` | the connector it is read from |
| `connectorReferences[].key` | the connector field |
| `connectorReferences[].available` | `false` when the connector does not exist or does not define `key`. The reference is then sent **as written** (e.g. the literal text `{region}`), like in a real run. Show a warning. |
| `staticReferences[].reference` | the reference exactly as written: **use this string as the key** of `staticValues` |
| `staticReferences[].type` | `DIRECT`, `WRAPPED_DIRECT`, `WEBHOOK`, `ENHANCEMENT`, `PAGE`, `REQUEST_DATA`, `GLOBAL`, or `null` when the text only looks like a reference |
| `globalReferences[].reference` | a global variable reference the backend fills in with the variable's current value: **no input needed**. The value itself is not listed. |
| `globalReferences[].name` | the variable's name |

All lists are in the order the references appear (headers, query, path, then body), without
duplicates.

---

## POST /connection/method/test

Sends the method's request to the real API.

```
POST /connection/method/test?connectionId=42
Content-Type: application/json
```

```json
{
  "method": { "...": "the same method object as for /refs" },
  "staticValues": {
    "${status}": "open",
    "#c0ffee.(response).id": 7
  },
  "confirmWrite": false
}
```

| Field | Required | Meaning |
|---|---|---|
| `method` | yes | the method to test |
| `staticValues` | when the method has static references | one entry per `staticReferences[].reference`. A value can be any JSON value: string, number, boolean, object, array or `null`. |
| `confirmWrite` | for writes | must be `true` to send anything other than `GET`, `HEAD` or `OPTIONS`. Default `false`. |

About the values:

- **Keys are the exact reference text**, including `#`, `$`, braces and paths. Take them from
  `/refs` rather than building them.
- When a reference is the **whole value** of a field, the value keeps its JSON type: `7` lands
  in the body as a number, an object as an object.
- When a reference is **part of a text** (`"Bearer {token}"`, `"id-${orderId}"`), the value is
  turned into text and inserted.
- Values that land in the URL are encoded for the URL by the backend; send them unencoded.
- A value given for a **connector** reference (e.g. `"{token}": "test-token"`) overrides the
  connector's data for this test. That's optional, but useful for trying another token. The
  same goes for a `globalReferences` entry.
- A global variable filled in by the backend is cast like in a real run: text in the URL, query
  and headers (an object or array as compact JSON), its JSON type in a body field that holds only
  the reference.

**200 OK: request sent**

```json
{
  "request": {
    "method": "GET",
    "url": "https://shop.example.test/orders?status=open",
    "headers": { "Authorization": ["Bearer ****"] },
    "body": null
  },
  "response": {
    "status": 200,
    "headers": { "Content-Type": ["application/json"] },
    "body": { "orders": [ { "id": 7 } ] }
  },
  "durationMs": 312,
  "connectorErrors": []
}
```

| Field | Meaning |
|---|---|
| `request.url`, `request.headers`, `request.body` | the request **as sent**, with sensitive connector values replaced by `****` (see below). `body` is text (the JSON/XML payload as a string), an object of field → values for form requests, or `null`. |
| `response.status` | the API's status. **Error statuses come back here too** (e.g. `404`, `500`, or `503` when the host cannot be reached), with a `200` around them: an API error is a test result, not a failure of this endpoint. |
| `response.headers` | header name → list of values |
| `response.body` | parsed JSON, plain text, or a **Base64 string** for binary content (files, images, PDFs) |
| `durationMs` | time the API took to answer |
| `connectorErrors` | empty when the request was sent |

**200 OK: request not sent, because a connector's data could not be read**

```json
{
  "request": null,
  "response": null,
  "durationMs": null,
  "connectorErrors": [
    { "connectorId": 3, "message": "Path $.access_token not found in {\"error\":\"invalid_client\"}" }
  ]
}
```

Typically the connector's authentication failed (wrong credentials, expired secret). Show the
message next to that connector. Nothing was sent to the method's API.

### Masking

Connector fields that the connector screen does not show in plain text (passwords, secrets,
tokens; `protected` or `private` in the invoker) are replaced by `****` wherever they appear
in `request`. The API received the real values. Public fields such as a username are shown as
they are. A private field that is not secret, such as a fixed base URL in some invokers, is
masked too, so a URL can look like `****/orders`. The **response is never masked**.

---

## POST /connection/method/curl

Returns the request of a method as a cURL command **without sending it**. The request is built
exactly as `/method/test` would send it, so the static values work the same way: call `/refs`
first and send a value for every static reference.

```
POST /connection/method/curl?connectionId=42
Content-Type: application/json
```

```json
{
  "method": { "...": "the method object, as for /refs" },
  "staticValues": { "${status}": "open" }
}
```

No `confirmWrite`: nothing is sent to the method's API, so a `POST` or `DELETE` needs no
confirmation. Connector authentication (e.g. a token request) still runs, so the command holds a
working token.

Response, `200 OK`:

```json
{
  "curl": "curl 'https://shop.example.com/api/orders?status=open' \\\n  -H 'Authorization: Bearer eyJhbGciOi…'",
  "connectorErrors": []
}
```

Shown as text:

```bash
curl 'https://shop.example.com/api/orders?status=open' \
  -H 'Authorization: Bearer eyJhbGciOi…'
```

- **Not masked.** The command holds the connectors' real credentials and tokens, so it runs as
  is. Do not log it, and copy it to the clipboard only on a user action.
- **For a POSIX shell** (bash, zsh, sh, Git Bash). Every argument is single-quoted, one option
  per line, joined by a trailing `\`. It does not run as is in Windows `cmd` or PowerShell.
- **Connector settings**: "Trust any Certificate" adds `--insecure`, a connector timeout adds
  `--connect-timeout` (in seconds). The server's outbound proxy is **not** added: the command is
  meant to run from the user's machine.
- When a connector cannot be read, `curl` is `null` and `connectorErrors` is set, as in
  `/method/test`.
- Errors are the same as `/method/test`, except `METHOD_TEST_WRITE_NOT_CONFIRMED`, which never
  occurs here.

---

## Errors

Standard `ErrorResource` shape: `timestamp`, `status` (number), `error`, `message`, `path`.

| Status | `error` | When | Frontend reaction |
|---|---|---|---|
| 400 | `METHOD_TEST_METHOD_INVALID` | the method has no `request` or no HTTP `method` | disable the test button until the method has a request method |
| 400 | `METHOD_TEST_WRITE_NOT_CONFIRMED` | a `POST`/`PUT`/`PATCH`/`DELETE`… was sent without `confirmWrite: true` | ask the user to confirm (see below), then resend with `confirmWrite: true` |
| 400 | `METHOD_TEST_STATIC_VALUES_MISSING` | a static reference has no entry in `staticValues`. `message` lists them, comma-separated. | highlight the missing inputs. Usually means `/refs` is stale (or was called with another `connectionId`/`categoryId`): call it again after the method changes. |
| 400 | `METHOD_TEST_WORKFLOW_AMBIGUOUS` | both `connectionId` and `categoryId` are given | send only one |
| 400 | `METHOD_TEST_REQUEST_NOT_BUILT` | the request cannot be built from the method and values, e.g. a blank endpoint or a value that does not fit its field. `message` says why. | show `message` |
| 404 | `CONNECTION_NOT_FOUND` | the method references a global variable and `connectionId` names no workflow | show `message` |
| 500 | — | the method's connector no longer exists, or its invoker has no operation with the method's name | show `message` |
| 401 | — | missing or expired token | usual re-auth flow |

Only `METHOD_TEST_*` codes are specific to these endpoints. A missing static value and an
unconfirmed write are both detected **before** anything is sent, and before any connector
authentication runs.

---

## Suggested UI flow

1. A **Test** action on a method in the workflow editor.
2. Call `/refs` with the method as it is in the editor (saved or not).
3. Show a form:
   - one input per `staticReferences` item, labelled with `reference`. Accept JSON, and fall
     back to plain text when the input is not valid JSON. `type` can drive a hint, e.g.
     "Webhook variable", "Response of method #c0ffee";
   - `connectorReferences` read-only, e.g. "filled in from connector Shop", with a warning when
     `available` is `false`;
   - `globalReferences` read-only, e.g. "current value of global variable pageSize".
4. If the method's HTTP method is not `GET`, `HEAD` or `OPTIONS`, show a confirmation such as
   "This sends a real POST to the API and can change data. Continue?" and send `confirmWrite:
   true` only after the user agrees.
5. Call `/test` and show:
   - `connectorErrors`, if any, and stop;
   - otherwise the request (method, URL, headers, body), the response (status, headers, body:
     pretty JSON, text, or a download for Base64 binary), and `durationMs`.
6. Optional: keep the entered values per method (by `color`) so the next test is pre-filled. Use
   session storage, not local storage: values can be real data.

```ts
type MethodTestRefs = {
  connectorReferences: { reference: string; connectorId: number; key: string; available: boolean }[];
  staticReferences: { reference: string; type: string | null }[];
  globalReferences: { reference: string; name: string }[];
};

type MethodTestResult = {
  request: { method: string; url: string; headers: Record<string, string[]>; body: unknown } | null;
  response: { status: number; headers: Record<string, string[]>; body: unknown } | null;
  durationMs: number | null;
  connectorErrors: { connectorId: number; message: string }[];
};

const workflow = connectionId != null ? `?connectionId=${connectionId}`
  : categoryId != null ? `?categoryId=${categoryId}` : '';

const refs: MethodTestRefs = await post(`/connection/method/test/refs${workflow}`, method);

const staticValues = Object.fromEntries(
  refs.staticReferences.map(r => [r.reference, parseOrText(inputs[r.reference])]));

const result: MethodTestResult = await post(`/connection/method/test${workflow}`, {
  method,
  staticValues,
  confirmWrite: isReadOnly(method.request.method) ? false : userConfirmed,
});
```

---

## Good to know

- **It is a real call.** The request reaches the real API with the connector's real credentials.
  A tested `POST` or `DELETE` really creates or deletes data. Connector authentication (e.g. a
  token request) also runs on every test.
- **Only this method runs.** Conditions, loops and jumps around it are ignored. Its own
  references are resolved from the static values, not from earlier methods. Global variables are
  read as they are now; a workflow that changes a variable during a run is not replayed.
- **Pagination is not followed:** the response is the first page only.
- **Timeouts and certificates** follow the method's connector settings (timeout, "Trust any
  Certificate") and the server's outbound proxy, the same as a real run. A pure HTTP request
  uses the defaults.
