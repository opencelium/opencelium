# Endpoint URL Encoding

How to write a method's endpoint URL, and how the backend turns it into the
request URL.

Write the URL the way you want it sent. The backend builds the final URL when
the method runs (`RequestEntityBuilder.defaultURLBuilder`): it replaces each
reference with its value and encodes whatever a URL cannot hold. The frontend
does not need to encode anything.

---

## 1. Typed text: encoded or plain both work

| You type | Sent |
|---|---|
| `my folder` or `my%20folder` | `my%20folder` |
| `Müller` | `M%C3%BCller` |
| `100%` (a lone `%`) | `100%25` |
| `/json/a[1]` (brackets in the path) | `/json/a%5B1%5D` |

- An existing `%XX` escape is kept as is. To send the literal text `%20`, type
  `%2520`.
- `/ ? & = # +` in typed text are treated as URL structure. If they are part of
  a value, encode them yourself: `q=a%26b`, `q=a%2Bb`.
- `[` and `]` are encoded only in the path. They stay as typed around an IPv6
  host (`http://[::1]:8081`) and in the query (`?filter[name]=x`).

## 2. References: insert them as is, never encode them

`{%#abc123.(response).success.id%}`, `${name}`, `@{page}`, `#{%…%}`, `{url}`

The backend replaces each reference with its value and encodes that value:

| Where | Value | Sent |
|---|---|---|
| Query | `Tom & Jerry` | `name=Tom%20%26%20Jerry` |
| Query | `a+b` | `q=a%2Bb` |
| Path | `items/5` | `/items/5` (`/` stays a separator) |
| Path | `a#b` | `/a%23b` |

These references are inserted as URL text, without that data encoding:

- a reference at the very start of the endpoint (`{url}`, or a full URL taken
  from another method)
- connector request data such as `{url}` or `{host}` in the path
- a query part that is only a reference: `?{%…%}`

## 3. Query

- Order and duplicate keys are kept: `?id=1&x=2&id=3`
- Empty values and flags work: `?q=&pretty`
- Deep objects work in any order: `?filter[age]=5&filter[name]=…`
- A typed webhook array expands: `?ids=${ids:array}` is sent as
  `ids=a&ids=b`

## 4. Frontend rules

- Send the endpoint string as the user typed it, with references untouched.
- The "Encode before sending" toggle can stay as it is, because the backend
  keeps text that is already encoded.
- Never run `encodeURIComponent` on the whole URL. It encodes `/ ? & {` and
  breaks both the URL structure and the references.
- Never replace characters with `_`. That changes the value.
