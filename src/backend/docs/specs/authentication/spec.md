# Authentication

## User story
As an OpenCelium user of a self-host installation, I want to log in with my username or my email and my password, so that I can work with core in a session that stays open during my work.

## Context
Each feature with an endpoint must know the OpenCelium user of a request and the tenant of that user. The request filter of the tenant context binds the tenant of the authenticated principal (decision 15), and this feature gives that principal. It also gives the session that the login strategies of the other authentication features use. Sections 5.2 (deployment modes), 6.3 (tenancy) and 6.7 (authentication and authorization) of the architecture document apply.

## Scope
Core authenticates an OpenCelium user with the local login strategy and keeps the session of that user. The feature does these things:

- It selects the login strategies by the deployment mode. The local login strategy is available in the self-host mode only.
- It starts a session when an OpenCelium user logs in with the correct password. The user gives the username or the email.
- It accepts a valid session JWT on each protected endpoint. It does not accept a request to a protected endpoint without a valid session JWT.
- It gives a new session JWT and a new refresh token when the HTTP client refreshes the session.
- It ends the session when the OpenCelium user logs out.
- It gives the data of the current OpenCelium user.

These terms apply in this specification:

- A **login strategy** is 1 method to authenticate an OpenCelium user: local credentials, LDAP, OIDC or the Service Portal (decision 10). The **local login strategy** compares the password with the password hash of the OpenCelium user in the database of core.
- An OpenCelium user **logs in** with a username or an email, and a password. An OpenCelium user can have 1 email. 2 OpenCelium users of 1 tenant do not have the same email.
- A **session** starts when an OpenCelium user logs in. It ends 24 hours after its start, or earlier when the user logs out or when its refresh token expires.
- The **session JWT** is a JWT that core issues and signs for a session. A request to a protected endpoint carries it. It expires 15 minutes after core issues it.
- The **refresh token** is a token that core issues with each session JWT. The HTTP client gives it to core to refresh the session. It expires 5 hours after core issues it.
- A **protected endpoint** is an endpoint of core that needs a valid session JWT. Each endpoint of core is protected, except an endpoint that its feature declares open. In this feature the open endpoints are the endpoints to log in, to refresh a session and to log out.
- The **current OpenCelium user** is the OpenCelium user of the session JWT of a request.
- A **locked** OpenCelium user cannot start a session. For example, core locks an OpenCelium user with a generated password that is older than 24 hours.
- A **core instance** is 1 process of `oc-app.jar`. A cloud installation can have more than 1 core instance.
- The **HTTP client** is the program that sends a request to core, for example the frontend or a script.

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### The local login strategy

- **AU-01** Given the self-host mode, when an OpenCelium user logs in with the correct password, then core must start a session. The response holds the session JWT and the refresh token. The default admin of the setup wizard can log in with the admin password `1234`. These rules apply to the name that the user gives:
  1. Core first looks for an OpenCelium user with that username, then for an OpenCelium user with that email.
  2. Core compares a username exactly. It compares an email without a difference between upper case and lower case.
- **AU-02** Given a wrong username or a wrong password, when a person logs in, then core must give the same response. The response is the same for a wrong username, a wrong email and a wrong password, with the status code 401. Thus it does not show which usernames and emails exist. No response and no application log line shows the password.
- **AU-03** Given a locked OpenCelium user, when the user logs in, then core must not start a session. The response says that the user is locked only when the password is correct. A wrong password gets the response of AU-02. Core starts a session for an OpenCelium user who must change a generated password, if the user is not locked.
- **AU-04** Given the cloud mode, when core starts, then the local login strategy must not be available. Thus a person cannot start a session with the password of an OpenCelium user in the database of core. In the cloud mode only the Service Portal authenticates a person (decision 10).

### The session JWT

- **AU-05** Given a valid session JWT, when a request asks for the current OpenCelium user, then core must return its data. The data has these items:
  1. The ID of the OpenCelium user.
  2. The username.
  3. The email.
  4. The tenant ID.
  5. The roles.

  The data never holds the password hash.
- **AU-06** Given no valid session JWT, when a request reaches a protected endpoint, then core must give the status code 401. A session JWT is not valid when it is expired or when its signature is not correct.
- **AU-07** Given a session JWT from 1 core instance, when another core instance gets it, then that instance must accept it. A restart of core also does not stop a valid session JWT.
- **AU-10** Given a deleted OpenCelium user, when a request asks for its data, then core must give the status code 401. The request carries a valid session JWT of that user. The response is the same as the response to a refresh of an ended session (AU-08). Thus the HTTP client logs in again.

### The refresh token

- **AU-08** Given a valid refresh token, when the HTTP client refreshes the session, then core must return a new session JWT. These rules apply to the refresh:
  1. The response also holds a new refresh token, and the old refresh token stops.
  2. A second use of an old refresh token ends the session.
  3. Core does not refresh the session of a locked or deleted OpenCelium user.
  4. A refresh does not move the end of the session after 24 hours.
- **AU-09** Given a session, when the OpenCelium user logs out, then core must not accept its refresh token again. To log out, the HTTP client gives the refresh token, and it needs no valid session JWT. The session JWT of the session stays valid until it expires.

## Out of scope
- The TOTP second factor of the local login strategy. The TOTP feature gives it.
- The LDAP login strategy and the OIDC login strategy of the self-host mode. Their features give them.
- The login strategy of the Service Portal in the cloud mode, on the redirect path and on the credential path. The portal login feature gives it. Thus the cloud mode has no login strategy in this feature.
- The management of the OpenCelium users. The user-management feature makes, changes and deletes an OpenCelium user. It also sets the email, changes the password and gives the rules for a generated password.
- The authentication with an API key.
- The permissions of an OpenCelium user: RBAC and the ACLs (decision 7).
- The authentication of a WebSocket session. The WebSocket gateway feature gives it.
- A list of the sessions of an OpenCelium user, and the end of the sessions of an OpenCelium user by an admin.
- A limit on the number of failed attempts to log in (open question 2).

## Decisions that apply
- Decision 10 of the architecture document: authentication is a plug-in strategy. The feature gives the local login strategy and selects the login strategies by the deployment mode (AU-04). Core issues its own session JWT for each login strategy.
- Decision 15: the request filter binds the tenant of the authenticated principal. The principal of a session gives the tenant of its OpenCelium user through the principal contract. In the self-host mode that tenant is always `self-host-tenant`.
- Decision 7: authorization uses the principal. The principal carries the roles of the OpenCelium user. No security filter of the feature has permission logic.
- Decision 11: the session JWT carries the tenant ID and no connection data.
- Decision 13: the feature adds no `opencelium.*` bootstrap property and no runtime setting. The times of a session are fixed values.
- Decision 14: the signing key of the session JWT is not a secret of a tenant and not a DEK. Decision 14 gives no place for it, and the new decision below gives it.
- Decision 16: the data that core keeps for a session belongs to the tenant of its OpenCelium user. It goes through the tenant-document access.
- A new decision is necessary for the signing key of the session JWT, which all core instances share (AU-07). The decision gives the source of the key and the place where core keeps it. The architect agent drafts it.
- A new decision is necessary for the place where core keeps the refresh tokens. In the cloud mode a refresh has no session JWT. Thus the decision also gives the source of the tenant of a refresh. The architect agent drafts it.

## Open questions
1. Which times apply to a session? Assumption until the answer comes: a session JWT expires after 15 minutes, a refresh token after 5 hours, and a session after 24 hours (assumption). The frontend uses the same 5 hours without activity and 24 hours after the start.
2. Must core limit the failed attempts to log in? Assumption until the answer comes: core has no limit, and a proxy in front of core can limit the rate (assumption).
3. Can 1 OpenCelium user have more than 1 session at the same time, for example in 2 browsers? Assumption until the answer comes: yes, core starts a new session each time, and when the OpenCelium user logs out, only that session ends (assumption).
4. Must each OpenCelium user have an email? Assumption until the answer comes: no, the email is optional, and the default admin of the setup wizard has no email (assumption).
5. Does the rule of AU-02 for the application log apply at each log level? Assumption until the answer comes: the rule applies at the default log level INFO. At the log level DEBUG, the libraries of core can write the name of a login or a value of a body that core does not accept (assumption).