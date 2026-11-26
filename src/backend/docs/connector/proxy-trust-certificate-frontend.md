# Outbound proxy and "Trust any Certificate" — frontend notes (OC-1678)

Audience: frontend developers and QA. Backend change: OC-1678 (fix in `5169a76b6`, tests in
`8cc24ce4c`).

**TL;DR — no frontend change is needed for OC-1678.** No endpoint, request or response field
changed. What changed is how the backend talks to external APIs through the server's outbound
proxy, so some runs that used to fail now succeed. Two related gaps were on
`POST /connection/remoteapi`, which has since been removed (see
[Known gaps](#known-gaps--resolved-by-removing-post-connectionremoteapi)).

---

## Background

When OpenCelium calls an external API it can go through an outbound proxy. The proxy is
configured on the server only, in `application.yml`; there is no UI for it:

```yaml
opencelium:
  rest-template:
    proxy:
      host: proxy.example.test
      port: 3128
      username: ...   # optional, used when the proxy requires a login
      password: ...
```

Each connector has the **Trust any Certificate** switch (`sslCert` on the connector,
label key `…fields.sslCert.label`). When it is on, the backend skips TLS certificate checks
for that connector's calls.

## What was broken, what changed

| Server proxy | Trust any Certificate | Before OC-1678 | After |
|---|---|---|---|
| not set | on or off | worked | unchanged |
| set, no login | off | worked | unchanged |
| set, no login | **on** | failed — the backend could not reach the proxy | works |
| set, with login | off | connection runs rejected by the proxy (user and password were swapped); connector check worked | works |
| set, with login | **on** | failed — could not reach the proxy, and a wrong login was sent | works |

Three backend bugs caused this:

1. Connection runs passed the proxy user as the password and the password as the user.
2. With *Trust any Certificate* on, the proxy login ignored the configured username/password.
3. With *Trust any Certificate* on, the proxy host and port were mixed up, so requests never
   reached the proxy.

## Where users will notice it

Only on installations with an outbound proxy configured:

- **Connection runs** — scheduled runs, *run now* on a schedule, and webhook-triggered runs.
  Runs that failed with proxy or connection errors (HTTP 407, "could not connect") now reach
  the target API. Their logs and results look like any other successful run.
- **Connector health check** — the check behind a connector's status and last test error.
  With *Trust any Certificate* on, it no longer fails at the proxy.

Nothing to do in the UI. If you had workarounds or hints for "proxy + trust certificate does
not work", they can go.

## Known gaps — resolved by removing `POST /connection/remoteapi`

Both gaps concerned `POST /connection/remoteapi`, which the GraphQL editor used to fetch schemas
and run queries (`remoteApiRequest.ts`). The endpoint has been removed: it let any logged-in
user make the backend call any URL with any headers. Calls to it now fail, so the GraphQL editor
has to move to `POST /connection/method/test`, which builds the request on the server from the
method and its connector.

- **No proxy login.** The endpoint used the proxy host and port but never the proxy
  username/password, so behind a proxy that requires a login its calls failed.
- **`sslOn` meant the opposite on each side.** It was then fixed on both sides (frontend
  OC-1581, backend OC-1692), which flipped the behaviour back: certificate checks were skipped
  for connectors with *Trust any Certificate* off.

## How QA can check OC-1678

1. Run a local forward proxy that requires a login (e.g. Squid with basic auth) and set
   `opencelium.rest-template.proxy.*` to it.
2. Create a connector to an HTTPS API and turn **Trust any Certificate** on.
3. Use it in a connection, trigger *run now* on its schedule, and let the connector health
   check run.
4. Expected: both succeed, and the proxy log shows the requests made with the configured user.
5. Repeat with **Trust any Certificate** off — same result.
