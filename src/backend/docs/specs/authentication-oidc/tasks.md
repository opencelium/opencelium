# Authentication with OIDC: the tasks

Each task is 1 pull request. The size rule of a task is in CONTRIBUTING.md, section 5.3.
A feature has 8 tasks or less. The status line is the only status in this folder.
A task that changes the behaviour of a criterion changes spec.md in the same PR.
When a task is done, its PR replaces the task with its done stub.

## The IdP of the hand tests
The hand tests of tasks 3 to 7 use Keycloak in a container as the IdP. Do not stop or delete other containers on the host. The Keycloak setup has these items:

- HTTPS on port 8443, with a certificate that the JVM of core trusts.
- The realm `oc` with the client `core`. The client permits the redirect URIs of the provider IDs `kc` and `kc2`.
- The IdP accounts `alice`, `bob` and `carol`, each with an email and the claim `email_verified` true.

The OIDC provider `kc` has the issuer URL of the realm `oc`, and the client ID and the client secret of `core`.

## Task 1: docs: record the OIDC login decisions in the architecture document
- **Criteria:** none. **Status:** done

## Task 2: feat(core): keep the OIDC providers in the settings API
- **Criteria:** AO-01, AO-09. **Status:** done

## Task 3: feat(core): list the OIDC providers as login options
- **Criteria:** AO-01, AO-02, AO-09. **Status:** done

## Task 4: feat(core): redirect the browser to the IdP of an OIDC provider
- **Criteria:** AO-03, AO-09. **Status:** done

## Task 5: feat(core): start a session after an OIDC login at the IdP
- **Criteria:** AO-03, AO-04, AO-06, AO-07. **Status:** done

## Task 6: feat(core): exchange a login code for the tokens of a session
- **Criteria:** AO-05, AO-08 (a locked or deleted OpenCelium user at the exchange; the answer of the IdP in task 7)
- **Read:** plan: decision 1, Interfaces and contracts (Endpoints, Error codes), Test strategy; architecture: 6.7, decisions 15, 18, 19, 28
- **Function:** The HTTP client exchanges the login code of an OIDC login for the session JWT and the refresh token. The current OpenCelium user, the refresh and the logout work with these tokens.
- **Tests:** `SessionTokensTest` (unit, more cases), `LoginCodeExchangeTest` (full application), `OidcLoginLogTest` (full application)
- **Hand test:** 1. Log in as `alice` through `kc` with a login verifier, and copy the login code from the address bar. 2. Send `POST /api/auth/login-code` with the login code and a wrong login verifier: 401 with `invalid-login-verifier`. 3. Send it again with the correct login verifier: the response has a session JWT and a refresh token. 4. Send `GET /api/auth/me` with the session JWT: the response shows the OpenCelium user of `alice`. 5. Send step 3 again: 401 with `session-ended`, and a refresh with the refresh token of step 3 fails.
- **Size:** approximately 230 lines
- **Depends on:** task 5
- **Status:** in work

## Task 7: feat(core): link an OIDC login by email, refuse a locked OpenCelium user
- **Criteria:** AO-07 (rule 2 and the email of rule 3), AO-08 (the answer of the IdP)
- **Read:** plan: decision 5, Interfaces and contracts (Error codes), Test strategy; architecture: 6.7, decisions 16, 18
- **Function:** An OIDC login can find its OpenCelium user by email, and a new OpenCelium user gets the email. The browser gets an error code for a locked OpenCelium user or for the email of another OpenCelium user.
- **Tests:** `OidcUserLookupTest` (full application, more cases), `OidcUsernameTest` (unit, more cases), `OidcCallbackTest` (full application, more cases)
- **Hand test:** 1. In `mongosh`, give the default admin the email of `bob`. 2. Set `email-link` of `kc` to true, and log in as `bob`: the default admin gets the OIDC link. 3. Lock the default admin in `mongosh`, and log in as `bob` again: the browser goes to `/login/oidc#error=user-locked`. 4. Set `email-link` of `kc` to false, and give the default admin the email of `carol`. 5. Log in as `carol`: the browser goes to `/login/oidc#error=email-taken`.
- **Size:** approximately 120 lines
- **Depends on:** task 5
- **Status:** open
