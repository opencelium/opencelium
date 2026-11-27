# Authentication with OIDC

## User story
As an OpenCelium user of a self-host installation, I want to log in with the account of my company IdP, so that I do not need a separate OpenCelium password.

## Context
A company often keeps the accounts of its staff in 1 identity provider (IdP), for example Microsoft Entra ID, Okta or Keycloak. In the self-host mode core is the OIDC client of that IdP (decision 10). After the login at the IdP, core starts the same session as the local login strategy of the authentication feature. Sections 5.2, 6.4, 6.5 and 6.7 of the architecture document apply.

## Scope
Core gives the OIDC login strategy in the self-host mode. The feature does these things:

- An installation admin configures 1 or more OIDC providers through the settings API.
- The HTTP client gets the OIDC providers for the login page, without a session JWT.
- Core redirects the browser to the IdP and examines the answer of the IdP.
- Core finds or makes the OpenCelium user of the ID token, and starts a session.
- Core redirects the browser back to the frontend. The HTTP client exchanges a login code for the 2 tokens of the session.
- No response and no log line shows a token or a code of the IdP.

The refresh, the logout and the current OpenCelium user are the same as in the authentication feature.

These terms apply in this specification:

- An **identity provider (IdP)** is the service of the customer that authenticates a person, for example Microsoft Entra ID, Okta, Keycloak or Google.
- An **OIDC provider** is the configuration of 1 IdP in core. It has a provider ID, a display name, the issuer URL, the client ID, the client secret and the email-link option. A provider ID has 1 to 40 characters: the letters a to z, the digits and the hyphen. Its first and last characters are not hyphens.
- The **ID token** is the JWT that the IdP gives to core after a login at the IdP. Its claims `iss` and `sub` identify the account of the person at the IdP.
- An **OIDC link** connects 1 pair of `iss` and `sub` to 1 OpenCelium user. Core makes it at the first OIDC login of the pair.
- The **email-link option** of an OIDC provider lets core link an ID token to an OpenCelium user with the same email.
- A **login code** is a value that core gives to the browser after an OIDC login. The HTTP client exchanges it for the session JWT and the refresh token.
- A **login verifier** is a random value of the HTTP client. It binds a login code to the HTTP client that started the login. It has 43 to 128 characters. Its characters are the letters A to Z and a to z, the digits, `-`, `.`, `_` and `~`.
- The **login options** are the list of the OIDC providers that the login page shows.

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### The OIDC providers

- **AO-01** Given the self-host mode, when an installation admin saves an OIDC provider, then core must keep it. These rules apply:
  1. An issuer URL needs HTTPS. A new or changed one needs a discovery document.
  2. Responses mask the client secret.
  3. The email-link option is off by default.
- **AO-02** Given 2 OIDC providers, when the HTTP client asks for the login options, then core must list their display names. The list has the provider ID of each, and the request needs no session JWT.

### The login

- **AO-03** Given an OIDC provider, when the HTTP client starts its login, then core must redirect the browser to the IdP. Core refuses an answer of the IdP after 10 minutes.
- **AO-04** Given a correct answer of the IdP, when core receives it, then core must start a session. Core redirects the browser to the frontend with a login code.
- **AO-05** Given a login code, when the HTTP client exchanges it, then core must return the 2 tokens of the session. These rules apply:
  1. Only the HTTP client that started the login can exchange it.
  2. A login code expires after 1 minute. A second use ends the session.
- **AO-06** Given a wrong answer of the IdP, when core receives it, then core must start no session. These rules apply:
  1. Core redirects the browser to the frontend with an error code.
  2. Core refuses a wrong state, issuer, audience, signature or nonce, and an expired ID token.

### The OpenCelium user of a login

- **AO-07** Given a correct ID token, when core looks for its OpenCelium user, then core must apply these rules:
  1. An OIDC link gives it.
  2. Else, with the email-link option and `email_verified` true, the email gives it.
  3. Else core makes it. It gets the email only with `email_verified` true.
- **AO-08** Given a locked OpenCelium user, when the person logs in through an OIDC provider, then core must start no session. The same applies when core must make a new OpenCelium user with the email of another OpenCelium user.

### The deployment mode

- **AO-09** Given the cloud mode, when core starts, then the OIDC login strategy must not be available. The login options hold no OIDC provider, and core refuses to save one.

## Out of scope
- The Service Portal login of the cloud mode. The portal login feature gives it. The Service Portal as an OIDC provider of a self-host installation is not a supported configuration, and core does not examine it.
- A map from the groups or the claims of the IdP to the roles. A new OpenCelium user from an OIDC login has no role, and an admin gives the roles.
- A logout at the IdP. A logout ends only the session of core.
- A change of the username or the email of an OpenCelium user at a later OIDC login.
- The removal of an OIDC link by an admin.
- The TOTP second factor for an OIDC login. The IdP gives its own second factor.
- The LDAP login strategy and SAML.
- The login page of the frontend.

## Decisions that apply
Decisions 7, 10, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24 and 25 of the architecture document.

A new decision is necessary for the path of the 2 tokens of a session to the frontend after a redirect of the browser. The decision also gives the path of an error code. The Service Portal login uses the same path. The architect agent drafts it.

A new decision is necessary for the place of the data of an OIDC login, from the redirect to the answer of the IdP. Each core instance must complete the login. The architect agent drafts it.

A new decision is necessary for the form of a setting with a list of items and a secret in each item. The architect agent drafts it at gate 2.

## Open questions
1. Which username does a new OpenCelium user get? Assumption until the answer comes: the email of the ID token, when `email_verified` is true. Else, the provider ID, a hyphen and the `sub`. If that username exists, core adds a hyphen and a number (assumption).
2. Where does the browser go after an OIDC login? Assumption until the answer comes: the frontend and core have 1 origin behind 1 proxy. Core redirects to the fixed path `/login/oidc` of that origin, and no request parameter changes the target (assumption).
3. What occurs to the OIDC links when an admin deletes an OIDC provider? Assumption until the answer comes: the links stop, and the OpenCelium users stay (assumption).
4. Can an OpenCelium user that core made at an OIDC login also use the local login strategy? Assumption until the answer comes: no, because the user has no password until the user-management feature sets one (assumption).
5. Must core limit the IdP accounts that get a new OpenCelium user, for example by the domain of the email? Assumption until the answer comes: no. The admin limits the accounts at the IdP, and a new OpenCelium user has no role (assumption).
6. Can the email-link option link an ID token to an OpenCelium user with the role `ADMIN`? Assumption until the answer comes: yes, because the option is off by default and needs `email_verified` true (assumption).
