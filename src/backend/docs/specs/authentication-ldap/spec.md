# Authentication with LDAP

## User story
As an OpenCelium user of a self-host installation, I want to log in with the account of my company LDAP directory, so that I do not need a separate OpenCelium password.

## Context
A company often keeps the accounts of its staff in an LDAP directory, for example Microsoft Active Directory or OpenLDAP. In the self-host mode, LDAP is 1 of the login strategies of core (decision 10). Core examines the password at the LDAP directory, and then it starts the same session as the local login strategy of the authentication feature. Sections 5.2, 6.4, 6.5 and 6.7 of the architecture document apply.

## Scope
Core gives the LDAP login strategy in the self-host mode. The feature does these things:

- An installation admin configures 1 LDAP directory through the settings API.
- A person logs in on the login endpoint of the local login strategy, with the username and the password of the LDAP account.
- Core selects the login strategy from the OpenCelium user of the username.
- Core finds or makes the OpenCelium user of an LDAP account, and starts a session.
- No response and no log line shows an LDAP password or the bind password.
- With `ldap`, a person on the network can read the passwords and can act as the LDAP server. Thus `ldap` is an explicit choice of the admin.

The refresh, the logout and the current OpenCelium user are the same as in the authentication feature. AU-02 has 1 exception: the status code 503 of AL-07 and the response time can show a local OpenCelium user.

These terms apply in this specification:

- An **LDAP directory** is the service of the customer that keeps the accounts of its staff, for example Microsoft Active Directory or OpenLDAP.
- An **LDAP account** is the entry of 1 person in the LDAP directory. Its **LDAP password** is the password that the LDAP directory examines.
- The **LDAP configuration** is the configuration of the LDAP directory in core. It has these items:
  1. 1 or more server URLs. When a server does not answer, core uses the next server URL.
  2. The **bind DN** (distinguished name) and the **bind password**. Core uses them to search the LDAP directory.
  3. The user search base and the user search filter. They find the LDAP account of a username.
  4. The username attribute and the email attribute of an LDAP account. A new LDAP OpenCelium user gets its username and its email from them.
  5. The **plain-LDAP option**. It permits a server URL with `ldap`, and it is off by default.
- An installation has 1 LDAP configuration or none.
- These rules apply to the server URLs:
  1. Core refuses a server URL with `ldap` when the plain-LDAP option is off.
  2. A list with `ldap` and `ldaps` server URLs is not valid.
  3. While a server URL with `ldap` exists, core writes a warning to the application log at each save and at each start.
- An **LDAP link** connects 1 LDAP account to 1 OpenCelium user. Core makes it at the first LDAP login of the LDAP account.
- An **LDAP OpenCelium user** is an OpenCelium user with an LDAP link. It has no password in core, and only the LDAP login strategy applies to it.
- When an admin deletes the LDAP configuration, the LDAP OpenCelium users stay.
- An **unknown username** is a username or an email of no OpenCelium user (AU-01).

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### The LDAP configuration

- **AL-01** Given the self-host mode, when an installation admin saves the LDAP configuration, then core must keep it. These rules apply:
  1. Each URL uses `ldap` or `ldaps`.
  2. A failed LDAP bind stops the save.
  3. Responses mask the bind password.
  4. A new URL must have the bind password.

### The login

- **AL-02** Given 1 LDAP account for an unknown username, when the person logs in correctly, then core must start a session. Core finds the LDAP link, or it makes an LDAP OpenCelium user without a role.
- **AL-03** Given an LDAP OpenCelium user, when the person gives the correct LDAP password, then core must start a session. Core binds only with the LDAP account of the LDAP link.
- **AL-04** Given no LDAP link, when an OpenCelium user logs in, then core must use only the local login strategy. Core sends no request to the LDAP directory.
- **AL-05** Given a wrong LDAP password, when a person logs in, then core must give the AU-02 response. These rules apply:
  1. Also for 0 or more than 1 LDAP account, or without an LDAP configuration.
  2. Core sends no empty password to the LDAP directory.
- **AL-06** Given a username with LDAP filter characters, when the person logs in, then core must search for the exact username.
- **AL-07** Given no LDAP server that answers, when an LDAP login starts, then core must give the status code 503. The response shows no server URL.
- **AL-08** Given a locked LDAP OpenCelium user, when the person logs in, then core must start no session. The same applies when the username or the email of a new OpenCelium user belongs to another OpenCelium user.

### The deployment mode

- **AL-09** Given the cloud mode, when core starts, then the LDAP login strategy must not be available. Core refuses to save an LDAP configuration.

## Out of scope
- A map from the groups of the LDAP directory to the roles. A new LDAP OpenCelium user has no role, and an admin gives the roles.
- More than 1 LDAP directory.
- A request to the LDAP directory at a refresh. When the LDAP directory disables an LDAP account, its session continues until it ends.
- A background task that reads the LDAP accounts, and the removal of an OpenCelium user when the LDAP directory deletes its LDAP account.
- A change of the username or the email of an OpenCelium user at a later LDAP login.
- A change of an LDAP password through core.
- The StartTLS operation.
- A setting for the CA (certificate authority) of an LDAP server. The operator adds a company CA to the trust store of the JVM.
- The TOTP second factor for an LDAP login.
- The OIDC login strategy and the Service Portal login.
- The login page of the frontend and the screen of the LDAP configuration.

## Decisions that apply
Decisions 7, 10, 13, 15, 16, 18, 19, 20, 21, 22, 23, 24, 25, 27 and 30 of the architecture document.

The LDAP configuration has the form of decision 30: a list with at most 1 item. Thus the rule for a kept secret applies to it (AL-01).

A new decision is necessary for a rule of a feature that uses the secret of a change. The LDAP bind at the save is that rule (AL-01). The architect agent drafts it at gate 2.

## Open questions
None.
