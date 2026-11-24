# Outbound proxy and "Trust any Certificate" — frontend notes (OC-1678)

Audience: frontend developers and QA. Backend change: OC-1678 (fix in `5169a76b6`, tests in
`8cc24ce4c`).

**TL;DR — no frontend change is needed for OC-1678.** No endpoint, request or response field
changed. What changed is how the backend talks to external APIs through the server's outbound
proxy, so some runs that used to fail now succeed. Two related gaps on
`POST /connection/remoteapi` were *not* changed and need a decision (see
[Known gaps](#known-gaps--not-changed-by-oc-1678)).

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

## Known gaps — not changed by OC-1678

Both concern `POST /connection/remoteapi`, which the GraphQL editor uses to fetch schemas and
run queries (`remoteApiRequest.ts`).

### 1. No proxy login

The endpoint uses the proxy host and port but never the proxy username/password. Behind a
proxy that requires a login, the call fails and `remoteApiRequest` returns `{ ok: false }`.
This is a backend follow-up; the frontend can't fix it.

### 2. `sslOn` means the opposite on each side — needs a decision

- The **frontend** sends the connector's *Trust any Certificate* value as `sslOn`:
  `useGraphQlFetcher.ts:14` and `DynamicTokenGraphQlStrategy.ts:68` both set
  `sslOn: connector.sslCert` (`StaticTokenGraphQlStrategy.ts` passes it through).
- The **backend** reads `sslOn` as "validate the certificate": it trusts any certificate only
  when `sslOn` is **false** (`ConnectionController`, added in `f6f5dcd41`, with a
  `TODO: rename isSslON`).

Result: with *Trust any Certificate* **on**, the GraphQL requests check the certificate; with it
**off**, they trust any certificate. Pick one fix:

- **Frontend:** send `sslOn: !connector.sslCert`, or
- **Backend:** drop the inversion so `sslOn` means "trust any certificate", ideally renaming
  the field to match the connector (`sslCert` / `trustCertificate`).

Don't do both, or the behaviour flips back.

## How QA can check OC-1678

1. Run a local forward proxy that requires a login (e.g. Squid with basic auth) and set
   `opencelium.rest-template.proxy.*` to it.
2. Create a connector to an HTTPS API and turn **Trust any Certificate** on.
3. Use it in a connection, trigger *run now* on its schedule, and let the connector health
   check run.
4. Expected: both succeed, and the proxy log shows the requests made with the configured user.
5. Repeat with **Trust any Certificate** off — same result.
