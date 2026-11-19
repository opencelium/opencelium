# Tenant context

## User story
As an operator of an OpenCelium installation, I want core to know the tenant of each request and of each background task, so that the data of 1 tenant stays apart from the data of all other tenants.

## Context
Decision 11 of the architecture document puts the tenant ID on each document, in each job message and on each event. Each feature that keeps data must know the tenant of its work. Thus this feature comes before the features that keep data, for example authentication, settings and workflows. Sections 5.2 (deployment modes), 6.3 (tenancy) and 6.7 (authentication and authorization) of the architecture document apply.

## Scope
Core gives exactly 1 current tenant to each request and to each background task. The feature does these things:

- It sets the current tenant. In the self-host mode the current tenant is always `self-host-tenant`. In the cloud mode the principal of a request gives the current tenant. A background task gets the current tenant from the record that starts the task.
- It keeps the current tenant for the parallel work that a request or a background task starts.
- It writes the tenant ID into each tenant document.
- It reads, changes and deletes only the tenant documents of the current tenant.
- It stops work that uses a tenant document without a current tenant.
- It writes the tenant ID into each line of the application log.

These terms apply in this specification:

- The **current tenant** is the tenant for which a request or a background task runs.
- A **background task** is work that core starts without a request. Examples are a scheduled execution of a workflow and the lock of an OpenCelium user with an old generated password.
- A **tenant document** is a database document that belongs to exactly 1 tenant. Examples are a workflow, a connector, an OpenCelium user and an execution.
- The **reserved values** `self-host-tenant` and `system` are tenant IDs that only core gives. The value `self-host-tenant` is the 1 tenant of a self-host installation. It is not the value `self-host` of the deployment mode. The value `system` is for the data of the installation itself.
- The **data of the installation itself** belongs to no tenant. Thus it is not a tenant document. Examples are the tenant catalog and the system DEK.
- The **application log** is the log of the core application. It is not the log stream of an execution.

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### The current tenant

- **TC-01** Given the self-host mode, when a request or a background task runs, then the current tenant must be `self-host-tenant`. In the self-host mode a record with another tenant ID starts no background task.
- **TC-02** Given the cloud mode, when a request has an authenticated principal, then the principal must give the current tenant. The same rule applies to a WebSocket session. A header, a parameter and the body of a request never give the current tenant.
- **TC-03** Given a record of a tenant, when it starts a background task, then the task must run for that tenant. Examples of such a record are a schedule of a workflow and an event that a worker publishes. The background task runs with nobody logged in.
- **TC-04** Given a current tenant, when core starts parallel work, then that work must run for the same tenant. The engine does not know the current tenant.
- **TC-05** Given a tenant ID from outside core, when its form is not permitted, then core must not accept it. The Service Portal is outside core. The permitted form has these rules:
  1. The tenant ID has 1 to 64 characters.
  2. Each character is a lower-case letter from `a` to `z`, a digit or a hyphen.
  3. The first character and the last character are not a hyphen.
  4. The tenant ID is not a reserved value.

### Tenant documents

- **TC-06** Given a current tenant, when core writes a tenant document, then the document must hold the ID of that tenant. A tenant ID in the body of a request does not change the value that core writes.
- **TC-07** Given a current tenant, when core uses tenant documents, then it must use only documents of that tenant. The rule applies when core reads, changes or deletes a tenant document. A request for a document of another tenant gets the response of a document that does not exist. No role and no ACL entry gives access to a document of another tenant.
- **TC-08** Given work without a current tenant, when it uses a tenant document, then the operation must stop with an error. Core uses no default tenant in the cloud mode.

### Logs

- **TC-09** Given a current tenant, when core writes an application log line, then the line must contain the tenant ID.

## Out of scope
- The database of each tenant, the system database and the tenant catalog. The tenant catalog feature finds the database of a tenant in the cloud mode. In the self-host mode all data is in the database that the yml file names.
- The data of the installation itself. The tenant catalog feature gives its rules.
- The lifecycle of a tenant: onboarding, suspension and deletion. The Service Portal owns the lifecycle.
- The principal and the session JWT. The authentication feature authenticates the principal and writes the tenant ID into the session JWT as a claim.
- The tenant ID in a job message and in an event. The dispatch feature and the transport feature write it.
- A background task for all tenants in the cloud mode. Such a task must have the list of the tenants from the tenant catalog.
- The application log of a worker and the log stream of an execution.
- An OpenCelium user in more than 1 tenant, and a change of the tenant during a session.
- The permissions inside a tenant. RBAC and the ACLs give them.
- A view of the data of all tenants for the operator.

## Decisions that apply
- Decision 11 of the architecture document: each document carries the tenant ID. A background task finds its tenant with nobody logged in. An event that a worker publishes carries the tenant ID, and core uses it for TC-03. The self-host mode is the same behaviour with 1 static tenant.
- Decision 10: authentication produces a principal with the tenant. The principal gives the current tenant of a request (TC-02).
- Decision 7: RBAC and the ACLs apply inside 1 tenant. The tenant limit of TC-07 applies before each permission check.
- Decision 14: the wrap of a DEK authenticates the tenant ID. Thus the ID of a tenant does not change.
- Decision 9: a worker has no database. Thus only core applies the rules of the tenant documents.
- Decision 8: the engine writes the execution ID and the node ID into its log lines. TC-09 applies to the application log of core only.
- Decision 13: the feature adds no `opencelium.*` bootstrap property and no runtime setting.
- A new decision is necessary for the current tenant, the form of a tenant ID and the tenant ID in the application log. The architect agent drafts it.

## Open questions
1. Which form has a tenant ID that the Service Portal gives? Assumption until the answer comes: the form of TC-05 (assumption).
2. Must an application log line of a self-host installation show the tenant ID `self-host-tenant`? Assumption until the answer comes: yes, the 2 deployment modes write the same form of line (assumption).
3. Can 1 OpenCelium user belong to more than 1 tenant? Assumption until the answer comes: no, a login of an OpenCelium user gives exactly 1 tenant (assumption).
