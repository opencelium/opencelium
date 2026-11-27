# Authentication with OIDC: the plan

## Approach
An installation admin keeps the OIDC providers in 1 installation setting with a list of items (AO-01). An open endpoint gives the login options (AO-02). Another open endpoint keeps a login record and redirects the browser to the IdP (AO-03). At the redirect URI, core reads and deletes the login record, gets the ID token for the code of the IdP, and examines it (AO-06). The users block finds or makes the OpenCelium user (AO-07, AO-08), and core starts a session. Core then redirects the browser to the frontend with a login code. The HTTP client exchanges it and its login verifier for the 2 tokens (AO-04, AO-05).

## Modules and packages
All code is in `core`, with the login strategies, the users and the settings API (section 3.4). A worker does no login, so the 2 deployment shapes behave the same. The engine does not use the feature, so nothing goes into `common` or `execution`.

- `core.auth.oidc`: the OIDC client. It reads the discovery document, sends the authorization request with PKCE (proof key for code exchange) and the token request, and examines the ID token. It has no endpoint, no database access and no setting, so the Service Portal login can use it again.
- `core.auth`: the endpoints, the login records, the setting definition of the OIDC providers, the login code and the login-code chain. The login code changes the session service and the security filter chains of this package. `core.auth` depends on `core.auth.oidc`, never the reverse.
- `core.user`: the OIDC links, and the rules of AO-07 and AO-08.
- `core.settings`: a setting type for a list of items with 1 secret in each item. A setting definition can have a rule of its feature, and another feature can read 1 installation setting.
- `core.tenant`: the tenant-document access gets 1 operation that reads and deletes a tenant document.

## Decisions

1. **The path of the tokens after a redirect.** How does the HTTP client get the tokens or an error code after a redirect?
   - (a) A login code, a signed token of a third type, for an exchange on a third security filter chain, the login-code chain.
   - (b) A random login code in a collection, for an exchange at an open endpoint.
   - (c) The 2 tokens in the URL of the redirect.
   - Recommended: (a). The login-code chain gets the tenant from a signed token before the tenant bind, also in the cloud mode (decision 15). Option (b) has no tenant for that bind in the cloud mode. Option (c) puts the tokens into the history of the browser. The login verifier binds the login code to the browser that started the login (RFC 9700).
   - Candidate for section 7. The record changes the 2 security filter chains of decision 18, and the problem-details clause of decision 19 for a redirect login.
2. **The data of an OIDC login.** Where does core keep the state, the nonce and the PKCE verifier until the IdP answers?
   - (a) A login record for each login, a tenant document in the collection `oidc_logins`. Core reads and deletes it in 1 operation.
   - (b) A signed state value with the data, without a database.
   - (c) A server session.
   - Recommended: (a). Each core instance can complete the login, a second answer finds no login record, and a TTL index deletes an old one (AO-03). Option (b) cannot refuse a second answer, and it shows the PKCE verifier to the browser. Option (c) is against decision 18.
   - Candidate for section 7. The record puts the check of an ID token with the public key of an IdP outside the cryptography rule (decision 21). It adds the login record of the Service Portal login to the open decisions.
3. **The form of the OIDC providers.** How does the settings API keep a list with 1 client secret in each item?
   - (a) 1 setting key `oidc.providers` with a list of items. Each item keeps a secret reference.
   - (b) A fixed number of OIDC providers with their own setting keys.
   - (c) Endpoints of the feature with their own collection.
   - Recommended: (a). 1 update of the settings document changes all OIDC providers or none (decision 24), and their number has no fixed limit. Option (c) is against the scope of the spec. A change refuses `****` (SS-08 of the settings spec). An item without a client secret keeps the secret of its provider ID, if its issuer URL does not change. Core deletes the secret of a removed item.
   - Candidate for section 7. The record extends decision 24.
4. **The OIDC client.** Which code makes the requests to the IdP and examines the ID token?
   - (a) The OAuth2 login of Spring Security, with its filters and its storage.
   - (b) The building blocks of the library `spring-security-oauth2-client`, on the endpoints and login records of core.
   - (c) An OIDC client of core on Spring RestClient.
   - Recommended: (b). A tested library examines the ID token (AO-06), and core keeps the control of the storage and of the redirects. Option (a) keeps the login in a server session and the tokens of the IdP in memory by default. Option (c) puts the protocol checks into the code of core. The feature adds the library without its Spring Boot starter, so Spring Boot adds no endpoint.
5. **The place of an OIDC link.** Where does core keep the pair of `iss` and `sub` of an OpenCelium user?
   - (a) A list of OIDC links in the user document.
   - (b) A collection of OIDC links.
   - Recommended: (a). Core makes the OpenCelium user and its first OIDC link in 1 document. A partial unique index on the pair refuses a second OpenCelium user for it, without a transaction.
6. **The redirect URI at the IdP.** No setting gives the host of core for the redirect URI. Where does core get it?
   - (a) From the request, with the `Forwarded` headers that the standard Spring property `server.forward-headers-strategy` permits.
   - (b) From a new installation setting with the public address of core.
   - Recommended: (a), because it adds no setting. The IdP accepts only a registered redirect URI, so a false header sends no code to another host. Option (b) is a candidate for section 7 and a change of the spec.

## Interfaces and contracts

**Endpoints.** The main chain opens the 3 open endpoints and ignores a bearer token on them, as on the login.

| Method and path | Purpose | Permission |
|---|---|---|
| `GET /api/auth/oidc/providers` | The login options (AO-02) | Open |
| `GET /api/auth/oidc/{provider-id}/login` | Takes the SHA-256 hash of the login verifier and redirects to the IdP (AO-03) | Open |
| `GET /api/auth/oidc/{provider-id}/callback` | The redirect URI; redirects to the frontend (AO-04, AO-06) | Open |
| `POST /api/auth/login-code` | Exchanges the login code, a bearer token, and the login verifier in the body for the 2 tokens (AO-05) | The login-code chain |
| `GET/PATCH /api/settings` | The setting key `oidc.providers` (AO-01) | The rule "installation admin" (decision 22) |

**The redirect to the frontend.** The target is the path `/login/oidc` without a host (open question 2 of the spec). After the `#` it has `code=<login code>` or `error=<error code>`.

**Error codes.** A redirect error has no body (plan decision 1). Each other error has the problem-details form, and an exchange without a valid login code gets 401 without a body (decision 19).

| Error code | Response | Cause |
|---|---|---|
| `unknown-provider` | Redirect | No OIDC provider has the provider ID, also in the cloud mode (AO-09) |
| `login-expired` | Redirect | A wrong state, a second answer or a late answer (AO-03) |
| `idp-error` | Redirect | An error from the IdP, also for the token request |
| `invalid-id-token` | Redirect | AO-06, rule 2 |
| `user-locked`, `email-taken` | Redirect | AO-08 |
| `bad-request` | Redirect or 400 | No hash at the start, or no valid login verifier at the exchange |
| `invalid-login-verifier` | 401 | A wrong login verifier; the login code stays valid |
| `session-ended` | 401 | A second use of the login code (AO-05), or a locked or deleted OpenCelium user at the exchange (AO-08) |
| `invalid-settings` | 400 | AO-01; the field `errors` (decision 23) has `invalid-value`, or `no-discovery-document` for rule 1 |

**The setting.** `oidc.providers` is an installation setting (decision 20), and each client secret is a secret of the installation. The default is an empty list. An item has the fields `id`, `display-name`, `issuer-url`, `client-id`, `client-secret` and `email-link`. The strategy reads the setting at each request and keeps no copy, so the open decision on the change notifications stays open.

**Bootstrap properties.** No new one. Behind a proxy, the operator sets the standard Spring property `server.forward-headers-strategy`, and the sample yml file gets 1 comment line. The times of AO-03 and AO-05 are fixed values (decision 18).

**The calls to an IdP.** Each call has HTTPS only, a timeout, a size limit and no redirect. An error names the provider ID and never the body of a response. The OIDC client reads the discovery document itself and makes the ID-token decoder from the address of the public keys. Thus the library makes no call without these limits, and `core.auth.oidc` names no key type (build rule 2).

## Test strategy

| Criterion | Unit | Slice | Full application |
|---|---|---|---|
| AO-01 | The list type: the mask, the kept secret, a refused `****`, a new issuer URL without a secret, a removed item | — | The settings API with the fake IdP; the plaintext only in `secrets` |
| AO-02 | — | — | The login options without a session JWT |
| AO-03 | — | — | The state, the nonce and PKCE; an answer 1 second late, with the mutable clock |
| AO-04 | — | The target with the login code | The session record and the redirect |
| AO-05 | — | — | A wrong login verifier, then the correct one; the expiry; a second use; a locked OpenCelium user at the exchange. The session JWT of the first exchange stays valid until it expires (decision 18). |
| AO-06 | Each item of rule 2; the limits of the calls to an IdP | The error target | No session after a wrong answer |
| AO-07 | The username of open question 1 | — | Each rule, with OpenCelium users in MongoDB |
| AO-08 | — | — | A locked OpenCelium user; the email of another OpenCelium user |
| AO-09 | — | — | A cloud start: empty login options, a refused change, a refused start |

The full-application tests use these helpers of `testsupport`: the local MongoDB, the MongoDB integration annotation, the mutable clock, the cloud start and the settings requests. A new fake IdP in `testsupport/fake` makes its keys in memory and signs ID tokens. It answers through a mock of the HTTP client of Spring. No test resource holds a key.

1 full-application test captures the application log and the responses of a login. It finds no ID token, no code of the IdP and no client secret (the scope of the spec).

## Risks

| Risk | How the plan handles it |
|---|---|
| An issuer URL sends core to an address inside its network | Only an installation admin sets it. The limits of "The calls to an IdP" apply to each endpoint of the discovery document. |
| An IdP answers to the redirect URI of another OIDC provider | Each OIDC provider has its own redirect URI, and the login record must have the provider ID of the path. |
| Another person gets a copy of a login code | The login code is after the `#`, has 1 use and the life of AO-05, and needs the login verifier (plan decision 1). |
| A token, a code of the IdP or a client secret in a log | No log line has a response of the IdP. Core zeroes the bytes of the client secret after use (decision 24). |
| Each request to the open login endpoint writes a login record and can call the IdP | The TTL index of AO-03 limits the login records. Core keeps the discovery document and the public keys of an issuer URL for a short time. A proxy limits the rate (authentication spec, open question 2). |

## Definition of done
- Each criterion of spec.md has a test that passes.
- `./gradlew build` is green.
- The hand tests of tasks.md are done.
- The architecture document and the writing guide are updated when the plan changes them.
- Section 7 has the records of plan decisions 1, 2 and 3. Sections 3.4 and 6.7 and the open decisions agree with them.
- `docs/security/README.md` shows the OIDC login and the Service Portal redirect login with the login code.
