# Authentication: the plan

## Approach
Core authenticates an OpenCelium user with a login strategy. Then it keeps a session with 2 tokens of its own: the session JWT and the refresh token. The login strategies are authentication providers of Spring Security (plan decision 1). Core signs the 2 tokens with 1 signing key of the installation (plan decision 3). A session record in the database of the tenant holds the state of a session (plan decision 4). The sections below give the build order, and each section ends in a state where `./gradlew build` is green.

### The signing key
At the start, after the key canary, the signing-key loader of `core.secrets.keys` puts the signing key into memory. It does these steps:

1. It reads the system DEK from the `keys` collection of the database that the yml file names. On a new installation it generates the system DEK, wraps it with the root key and stores it (decision 14).
2. It reads the newest signing key from the collection `signing_keys` of the same database and decrypts it with the system DEK. On a new installation it generates a random key of 32 bytes, encrypts it with the system DEK and stores it.
3. It keeps the decrypted key in memory and zeroes it when core stops.

The encryption is AES-256-GCM with a new IV, as for each secret (decision 14). The associated data names the purpose and the version of the signing key. Thus the ciphertext of a signing key does not decrypt as another value.

The signing key has its own collection, because the key canary and the generation guard read each document of `keys` as a wrapped DEK. The system DEK and the signing key are data of the installation itself (section 6.3), not tenant documents. Thus section 6.9 gets no new exception. The secret storage feature later uses the same system DEK.

If the stored signing key does not decrypt, the start stops and names the problem, as for a wrapped DEK (decision 14). Core generates no replacement key without a message. A reset of the secrets also deletes the documents of `signing_keys`.

A unique index on each of the 2 collections accepts only 1 document for each version. When 2 core instances start on an empty database at the same time, the instance whose insert fails reads the stored document. Thus each core instance and each restart uses the same key (AU-07). The loader runs only after the key canary. A wrong root key thus stops the start before core can wrap a new system DEK with it.

The signature itself is in `core.secrets.keys`, because the build rule of section 6.9 of the architecture document permits cryptography only in `core.secrets`. The block gives `core.auth` 1 JWT encoder and 1 JWT decoder for each token type, as the interfaces of Spring Security. `core.auth` owns the token types, the issuer and the claims, and gives them to the block as parameters. Thus `core.secrets.keys` does not depend on `core.auth`, and `core.auth` holds no key and no class of the cryptography of Java.

### The tokens
The 2 tokens are JWTs with the algorithm HS256. The JWT header field `kid` names the version of the signing key, and the JWT header field `typ` names the type of the token. The decoder of a type does not accept a token of the other type. Thus a refresh token is not valid as a session JWT (AU-06), and a session JWT is not valid for a refresh.

| Token | `typ` | Claims | Expiry |
|---|---|---|---|
| Session JWT | `oc-session+jwt` | `iss`, `sub` (user ID), `tid` (tenant ID), `sid` (session ID), `roles`, `iat`, `exp` | The time of the spec term "session JWT", but not after the end of the session |
| Refresh token | `oc-refresh+jwt` | `iss`, `sub`, `tid`, `sid`, `jti` (token ID), `iat`, `exp` | The time of the spec term "refresh token", but not after the end of the session |

The times of the spec terms are constants of `core.auth` (decision 13). The value of `iss` is `opencelium`. The decoders examine the signature, `typ`, `iss` and `exp` with the clock of core. The validation of a session JWT needs no database read.

### The login strategies
The authentication configuration of `core.auth` puts the providers of the deployment mode into 1 authentication manager (plan decision 1):

- The self-host mode has the local login strategy.
- The cloud mode has no provider of this feature (AU-04). The login endpoint then gives the response of AU-02 to each attempt.

The local login strategy is the password provider of Spring Security. It has a user lookup over the user service and the password encoder of `core.user`. The lookup follows rule 1 of AU-01. For a name that does not exist, the provider compares the password with a fixed hash, so the response takes approximately the same time (AU-02). The provider examines the lock after the password (AU-03). The default of Spring Security examines the lock first, and that order shows the lock to a wrong password.

The provider gives the OpenCelium user of the login, with the user ID, the username, the tenant ID and the roles. Then the session service starts the session of that user. The 2 security filter chains give the principal of `core.auth` from a valid token. The principal holds the user ID, the tenant ID, the session ID and the roles. The roles come from the session JWT, so a change of the roles applies at the next refresh. The principal has no groups: the permissions are out of scope (decision 7). It implements the principal contract of `core.tenant`, so the request filter binds its tenant (decision 15).

### The session
A session record is a tenant document in the collection `sessions` (plan decision 4). It holds these values:

- the session ID, the tenant ID and the user ID
- the token ID of the current refresh token
- the start and the end of the session

The session repository of `core.auth` uses the tenant-document access (decision 16). A token ID is not a secret, because it gives no access without the signature of core. A TTL index on the end removes old session records. MongoDB runs the TTL removal approximately each 60 s, so the session service also compares the end with the clock.

The session service has these operations:

- **Start.** After a successful login it inserts a session record and issues the 2 tokens (AU-01).
- **Refresh.** It reads the session record of the `sid` of the refresh token and applies the rules of AU-08 in this order:
  1. A record that does not exist, or whose end is past, stops the refresh.
  2. A `jti` that is not the current token ID deletes the record.
  3. A locked OpenCelium user, or a user that does not exist, deletes the record.
  4. Else a conditional change replaces the token ID, and the service issues 2 new tokens.

  When the conditional change finds no record, a parallel refresh used the same token first. Rule 2 of AU-08 then applies.
- **End.** It deletes the session record of the `sid` of the refresh token (AU-09).

A user who must change a generated password and is not locked gets a session (AU-03). A failed attempt writes 1 line to the application log with the reason, but without the name and without the password. The name can hold a password that a person typed into the wrong field.

### The security filter chains
`core.auth` declares 2 security filter chains. The 2 chains are stateless: no server session and no cookie, and thus no CSRF token (plan decision 5).

1. **The refresh chain** matches the refresh endpoint and the logout endpoint. It authenticates the bearer token with the decoder of the refresh token.
2. **The main chain** matches each other request. It permits the login endpoint and the error page of Spring without a token. It authenticates each other request with the decoder of the session JWT. A request without a valid session JWT gets the status code 401 from the entry point of the bearer-token filter (AU-06).

The login endpoint ignores a bearer token, so an old session JWT does not stop a new login. The 2 chains add the bearer-token filter of Spring Security themselves. The configurer of the resource server also opens an endpoint for the metadata of the resource, and core opens only the endpoints that a feature declares.

The 2 chains give the principal of `core.auth`. The request filter of `core.tenant` runs after the chains and binds the tenant of the principal (decision 15). Thus a refresh in the cloud mode has a current tenant before it reads its session record. In the self-host mode the request filter binds `self-host-tenant` for each request, so the login endpoint can read the OpenCelium users.

### The endpoints
The endpoints are in `core.auth`. "Interfaces and contracts" lists them. An error response has the problem-details form (plan decision 7), and an exception handler of `core.auth` writes it for the endpoints of this feature. The shared part is only the convention of plan decision 7. A request without a valid token is the 1 exception: its response has no body (AU-06).

### The email of an OpenCelium user
The user document gets the field `email`. Core keeps the email in lower case, and the login lookup compares the lower-case form of the name (plan decision 8). A partial unique index on the tenant ID and the email accepts each email 1 time in a tenant. A user without an email is outside the index. The user-management feature writes the email. This feature only reads it, so a hand test sets the email with `mongosh`.

## Modules and packages
The feature adds no module.

| Package | Content | Why this module |
|---|---|---|
| `core.auth` | The 2 security filter chains, the login strategies of each mode, the principal, the session service and its repository, the endpoints and the error responses | Section 3.4 of the architecture document puts the security filter chain here. A lower module is not possible: the engine and the workers have no authentication (decisions 4 and 9), and `common` holds contracts only. |
| `core.secrets.keys` | The system DEK at the first start, the signing key, the JWT encoder and the 2 JWT decoders | The build rule of section 6.9 permits cryptography only in `core.secrets`. The root key and the DEK wrap are in this package (section 3.4). |
| `core.user` | The field `email`, its index, and the 2 reads of the login lookup | The feature of the OpenCelium users owns its document and its repository (decision 16). |

The package `core.auth` depends on `core.user`, `core.secrets.keys` and `core.tenant`. The package `core.user` does not depend on `core.auth`. Thus the endpoint of the current OpenCelium user is in `core.auth`.

The feature is in core only. Thus the monolith and the distributed shape get the same behaviour. A job message carries no token, so a worker never sees a token.

## Decisions
The reviewer confirms each decision before task 1 starts.

1. **The login strategies are authentication providers of Spring Security.** How does core add a login strategy? Option (a): 1 authentication provider of Spring Security for each strategy, in 1 authentication manager for each deployment mode. Option (b): an own interface of `core.auth` for the login strategies. Recommended: (a), because Spring Security has providers for a password and for LDAP. The OIDC feature uses the OAuth2 client of Spring Security. The password provider also protects against a time measurement for a name that does not exist. With (b), the interface has 1 user in this feature, and each provider of Spring Security needs an adapter.
2. **The JWT library is the resource-server starter of Spring Boot.** Which library signs and validates the JWTs? Option (a): the new dependency `spring-boot-starter-security-oauth2-resource-server`, with the Nimbus library. Option (b): a different JWT library, for example JJWT. Option (c): own JWT code. Recommended: (a), because Spring Security then gives the bearer-token filter, the entry point for the status code 401 and the validation of the claims. The BOM of Spring Boot sets the version. The OIDC feature uses the same Nimbus library. Option (c) puts own cryptography code into core, and the project must then test and keep it.
3. **1 signing key for each installation, encrypted with the system DEK.** Where does the signing key come from, and where does core keep it? Option (a): a random key that core generates at the first start. The system DEK encrypts it, and core keeps it in the collection `signing_keys` of the yml database. Option (b): a random key that the root key wraps. Option (c): a key that core derives from the system DEK. Option (d): a value in the yml file or in an environment variable. Option (e): a key in the memory of each core instance. Recommended: (a), because each core instance then decrypts the same key with the same root key (AU-07). Option (b) changes decision 14, because the root key wraps only DEKs. Option (c) gives the DEK a second use, and a rotation of the DEK then ends all sessions. Option (d) makes the bootstrap list larger (decision 13). Option (e) does not agree with AU-07. The algorithm is HS256, because only core validates its tokens. The signing key is key material, like the root key and a DEK. Thus the secret rules of decision 13 do not apply to it, and core keeps the decrypted key in memory, because each request uses it. This decision extends decision 14: each installation has 1 system DEK from the first start, in the 2 deployment modes. Its wrap authenticates the reserved value `system` as the tenant ID. Candidate for section 7 of the architecture document; the architect agent drafts the record.
4. **The refresh token is a signed JWT, and the session record is a tenant document.** How does core keep a session, and how does a refresh find its tenant? Option (a): a refresh token of its own JWT type, with the tenant ID, the session ID and a token ID. A session record holds the current token ID, and a security filter chain authenticates the refresh token. Option (b): a random refresh token without a signature, with its hash in a session record in the system database. Option (c): a random refresh token with the tenant ID as plain text. Recommended: (a), because the request filter then binds the tenant of an authenticated principal (decision 15). The session record also stays in the database of the tenant (decision 11). The record holds the token ID and no hash of the token. A token ID alone does not make a valid token, because only core has the signing key. Option (b) adds a fourth read without the tenant-document access to section 6.9. Option (c) takes the tenant from the request, and decision 15 does not permit that. Candidate for section 7 of the architecture document; the architect agent drafts the record.
5. **The 2 tokens travel as bearer tokens, without a cookie.** How does the HTTP client get and send the tokens? Option (a): the JSON body of the response holds the 2 tokens. The HTTP client sends each token in the header `Authorization` as a bearer token. Option (b): the same for the session JWT, but the refresh token in a cookie that a script cannot read. Recommended: (a), because core then keeps no server session and needs no CSRF token. The frontend also sends its token in that header. With (a), a script that an attacker puts into the frontend can read the refresh token. AU-08 limits the damage: a second use of a refresh token ends the session, and each session has an end. Option (b) is safer against such a script, but it needs a CSRF protection and a cookie setting for the domain of the frontend. A later feature can add (b). Candidate for section 7 of the architecture document; the record of plan decision 4 carries it.
6. **Core has its own endpoint contract under `/api/auth`.** Which paths and forms do the endpoints have? Option (a): the contract of "Interfaces and contracts", and the frontend changes its password strategy. Option (b): the contract that the frontend calls. It has `/login` with the field `email`, the token in a header of the response, and `/user/{id}` with a numeric user ID. Recommended: (a), because the contract of (b) has no refresh token and needs a numeric user ID. Thus the frontend must change in each case. The prefix `/api` keeps the endpoints apart from the pages of the frontend, for example `/login`. The prefix applies to each REST endpoint of core. Thus a proxy can send the paths under `/api` to core and each other path to the frontend. Candidate for section 7 of the architecture document; the record of plan decision 7 carries it.
7. **An error response has the problem-details form with a code.** Which form has the body of an error response? Option (a): the problem-details form of RFC 9457, which Spring writes, with the extra field `code`. Option (b): an own JSON form. Recommended: (a), because Spring writes the form without own code. The HTTP client reads the field `code` and not a message text. The endpoints of this feature are the first endpoints of core, so the form also applies to each later feature. A request without a valid token gets the status code 401 and no body (AU-06): this is the 1 response without the form. Core sets no property `spring.mvc.problemdetails.enabled`, because the exception handler of `core.auth` writes the form. The response to a request that reaches no endpoint of a feature, for example an unknown path, stays with the open decision "REST API contract style". Candidate for section 7 of the architecture document; the architect agent drafts the record.
8. **Core keeps the email in lower case.** How does core compare an email without a difference of upper case and lower case (AU-01)? Option (a): core keeps the email in lower case and compares the lower-case form of the name. Option (b): an index with a case-insensitive collation of MongoDB. Recommended: (a), because the tenant-document access takes plain conditions and has no collation. The user document of `core.user` turns each email into lower case, so each writer of an email gets the rule.

## Interfaces and contracts

### Endpoints

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `POST` | `/api/auth/login` | Start a session (AU-01 to AU-04) | Open |
| `POST` | `/api/auth/refresh` | Refresh a session (AU-08) | A valid refresh token as the bearer token |
| `POST` | `/api/auth/logout` | End a session (AU-09). The response has the status code 204 and no body. | A valid refresh token as the bearer token |
| `GET` | `/api/auth/me` | The data of the current OpenCelium user (AU-05) | A valid session JWT as the bearer token |

- The body of a login has the fields `username` and `password`. The field `username` takes a username or an email (AU-01). Each field has at most 256 characters.
- The response of a login and of a refresh has the fields `sessionJwt`, `sessionJwtExpiresAt`, `refreshToken` and `refreshTokenExpiresAt`. A time is an ISO 8601 instant in UTC.
- The response of `/api/auth/me` has the fields `id`, `username`, `email`, `tenantId` and `roles`. It has no field for the password hash (AU-05).
- No endpoint needs a role or an ACL entry. The permissions are out of scope (decision 7).

### Error responses

| Code | Status code | When |
|---|---|---|
| `invalid-credentials` | 401 | A wrong username, a wrong email or a wrong password (AU-02). Each attempt in the cloud mode (AU-04). A locked user with a wrong password (AU-03). |
| `user-locked` | 403 | A locked user with the correct password (AU-03) |
| `session-ended` | 401 | A refresh after one of the rules 1 to 3 of "The session" (AU-08) |
| `bad-request` | 400 | A login body that is not JSON, without a `username` or without a `password`, or with a field of more than 256 characters |

A request without a valid session JWT or refresh token gets the status code 401 from the entry point of the bearer-token filter (AU-06). The response has the header `WWW-Authenticate` and no body.

### Other contracts
- **The tokens.** The table in "The tokens" gives the JWT header fields and the claims.
- **The principal of `core.auth`.** It implements the principal contract of `core.tenant` (decision 15).
- **The collection `sessions`.** A tenant document. A TTL index on the field of the end.
- **The collection `signing_keys`.** Data of the installation itself, in the database that the yml file names. A unique index on the version.
- **The collection `keys`.** It gets the system DEK and a unique index on the tenant ID and the DEK version.
- **The collection `users`.** It gets the field `email` and a partial unique index on the tenant ID and the email.
- **The new dependency** `org.springframework.boot:spring-boot-starter-security-oauth2-resource-server` (plan decision 2). The BOM of Spring Boot sets its version.
- **No configuration value.** The feature adds no bootstrap property and no runtime setting (decision 13). Core makes its own JWT decoders, so the properties `spring.security.oauth2.resourceserver.*` stay unset.

## Test strategy
Each test that touches MongoDB is a full-application test against the local MongoDB, with `LocalMongo` and `MongoIntegrationTest` of `testsupport`. The endpoint tests use MockMvc in the full application. A test that changes the time uses `MutableClock`.

| Criterion | Tests |
|---|---|
| AU-01 | A full-application test in the self-host mode: a login with the username, and a login with the email in mixed case. Each response holds the 2 tokens. A unit test of the lookup: a username that is also the email of another user gives the user of the username. |
| AU-02 | A full-application test: a wrong username, a wrong email and a wrong password give the same status code and the same body. The captured application log holds no password and no name. |
| AU-03 | A full-application test: a locked user with the correct password gets `user-locked`, and with a wrong password the response of AU-02. A user who must change a generated password gets a session. |
| AU-04 | A full-application test in the cloud mode with `CloudStart`: a login gets `invalid-credentials`. A unit test of the authentication configuration: the cloud mode has no provider. |
| AU-05 | A full-application test: a login, then `/api/auth/me` with the session JWT. The response holds the 5 items and no password hash. |
| AU-06 | A full-application test of `/api/auth/me`: no token, an expired token, a token with a different key, and a refresh token. Each gets the status code 401. |
| AU-07 | A full-application test with 2 Spring contexts on 1 database: a session JWT of context 1 is valid in context 2. A restart of context 1 keeps the session JWT valid. The collection `signing_keys` holds 1 document. A full-application test with 2 threads on an empty database: the 2 loaders read the same signing key. |
| AU-08 | A full-application test: a refresh gives 2 new tokens. A second use of the old refresh token gets `session-ended`, and then the new refresh token also gets it. A locked user and a deleted user get `session-ended`. After the end of the session a refresh gets `session-ended`, and no token expires after the end. |
| AU-09 | A full-application test: a logout gets 204, and a refresh after it gets `session-ended`. The session JWT stays valid on `/api/auth/me` until it expires. |

The unit tests also cover the decoders: a token with a wrong `typ`, a wrong `iss` or a wrong `kid` is not valid.

The tests use these fakes and fixtures of `testsupport`:

- `LocalMongo`, `MongoIntegrationTest`, `MutableClock`, `CloudStart` and `CoreStartup`.
- A new token fixture. It signs a JWT with a given key, type and time, for the tokens that are not valid.
- A new user fixture. It inserts an OpenCelium user with an email, a lock or a generated password through the tenant runner.

## Risks
| Risk | How the plan handles it |
|---|---|
| 2 tabs of a browser refresh at the same time with 1 refresh token. The second refresh ends the session (AU-08). | The frontend sends 1 refresh at a time and gives the result to each tab. The plan keeps the rule of AU-08 without a grace time. |
| A script that an attacker puts into the frontend reads the tokens from the storage of the browser. | The rules of AU-08 and the end of each session limit the damage (plan decision 5). A later feature can move the refresh token into a cookie. |
| A wrong root key wraps a new system DEK. | The signing-key loader runs after the key canary, so a wrong root key stops the start first. |
| 2 core instances start on an empty database at the same time. | The unique indexes accept 1 system DEK and 1 signing key. The instance whose insert fails reads the stored document. |
| The system DEK exists from the first start. A lost master key thus stops each later start, also without a secret of a workflow. | This is the guard of decision 14. The start message names the problem. The operator restores the master key, or resets the secrets and gets a new signing key. |
| The auto-configuration of the resource-server starter makes a JWT decoder or a default security filter chain. | Core declares its own security filter chains and decoders, and no property of the starter is set. A full-application test makes sure that a request without a token gets 401. |
| The frontend calls another contract (plan decision 6). | The frontend changes its password strategy. Until then the hand tests use `curl`. |
| A frontend on another origin needs CORS rules. CORS is cross-origin resource sharing. | The feature has no CORS rules. A proxy in front of core gives the frontend and the API 1 origin, or a later feature adds the rules. |
| The indexes of a tenant database in the cloud mode. | The index code follows the user indexes and runs on the database that the yml file names. The tenant catalog feature makes the indexes of each tenant database. |
| The TOTP feature needs a second step after the password. | The response of a login is a JSON object. The TOTP feature adds a second form of the response. |

## Definition of done
- Each criterion of spec.md has a test that passes.
- `./gradlew build` is green.
- The hand tests of tasks.md are done.
- The architecture document and the writing guide are updated when the plan changes them.
- Section 7 of the architecture document has the decision record of the signing key and the decision record of the session.
- In section 3.4 of the architecture document, the block "Keys" names the signing key and the system DEK of the first start. The block "Security filter chain" names the 2 chains.
- Section 4.1 of the architecture document has the start step of the signing-key loader after the key canary.
- Section 7 of the architecture document has the decision record of the error form and the prefix `/api`. Section 8 of CONTRIBUTING.md points to it.
- Section 6.5 of the architecture document shows the system DEK and the signing key, also in the self-host database. Section 6.7 names the 2 tokens.
- The block "Keys" of section 3.4 also names the token signature.
- The paths of `docs/security/README.md` and the path of the settings endpoint in the architecture document have the prefix `/api`.
- The list of the open decisions of the architecture document has the entry "REST API contract style": the OpenAPI file of a feature, and the error response to a request that reaches no endpoint of a feature.
