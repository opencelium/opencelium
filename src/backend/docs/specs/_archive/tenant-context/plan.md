# Tenant context: the plan

## Approach
Core holds the current tenant of a piece of work in 1 place, and each other block reads it there. A piece of work has a current tenant only after the tenant runner binds a tenant. In the self-host mode the tenant runner binds `self-host-tenant` on the same path as in the cloud mode (plan decision 2). The repositories of the tenant documents read and write through 1 tenant-document access. The default log pattern prints the tenant ID. The sections below give the build order, and each section ends in a state where `./gradlew build` is green.

### The tenant identifier
The tenant identifier of `common.tenant` accepts only a value with the form of rules 1 to 3 of TC-05. The 2 reserved values have that form. The check of a tenant ID from outside core is a second operation of the same block, with rules 1 to 4 of TC-05. The check applies to a tenant ID from the Service Portal. Examples are the tenant ID of a login of an OpenCelium user and the tenant ID of a catalog entry. It does not apply to an event, because an event carries the tenant ID that core wrote into its job message.

### The current tenant and the tenant runner
The current tenant is a read operation without mode logic. It gives the bound tenant of the thread. A thread without a bound tenant gets an error that says "no current tenant" (TC-08).

The tenant runner runs 1 task for 1 tenant. It binds the tenant to the thread, runs the task, and removes the tenant at the end, also after an error. A scoped value holds the bound tenant (plan decision 1). The tenant runner also writes the tenant ID into the mapped diagnostic context (MDC) of the log library, under the MDC key `tenant`. The tenant runner does not start the task and stops with an error in these 3 cases:

- In the self-host mode, the tenant is not `self-host-tenant` (TC-01).
- In the cloud mode, the tenant is a reserved value. The value `system` is for the data of the installation itself, which belongs to no tenant. The tenant catalog feature gives the rules for that data.
- The thread has a bound tenant, and the new tenant is a different tenant.

### The request filter
The request filter is a servlet filter that runs after the security filter chain. It runs the rest of each request through the tenant runner. In the self-host mode it binds `self-host-tenant` for each request, with or without a principal (TC-01). In the cloud mode it binds the tenant ID that the authenticated principal gives (TC-02). It reads no header, no parameter and no body. In the cloud mode a request without an authenticated principal runs without a bound tenant.

The principal gives its tenant ID through the principal contract of `core.tenant`. The authentication feature implements that contract with its principal. A WebSocket message is not a servlet request. Thus the WebSocket gateway feature calls the tenant runner for each message of a session, with the rule of the request filter (TC-02).

### Background tasks and parallel work
A background task calls the tenant runner with the tenant ID of the record that starts it (TC-03). The task has no principal. In the 2 deployment shapes core reads the tenant ID of an event from the event itself (decision 11). A background task of the self-host mode without a record calls the tenant runner with `self-host-tenant`. The completion runner of the wizard and the lock of an OpenCelium user with an old generated password are such tasks.

The task decorator carries the bound tenant to a task on another thread (TC-04). It reads the bound tenant at the moment when core gives the task to a task executor. Then it runs the task through the tenant runner on the new thread. Spring Boot applies a task decorator bean to the application task executor and to the task scheduler. Core starts parallel work only through a task executor of Spring. A thread that core starts in another way has no bound tenant, and TC-08 applies to it.

### The tenant documents
The tenant-document access of `core.tenant` is the 1 path from a repository to its tenant documents (plan decision 3). A repository gives the access a document type and a condition. For a change it also gives the new values. The access does these steps for each operation:

1. It reads the current tenant. Without a current tenant the operation stops before a query goes to MongoDB (TC-08).
2. It asks the connection resolver for the MongoDB connection of the current tenant.
3. It adds the condition "the field `tenantId` holds the ID of the current tenant" to each read, each change and each delete (TC-07).
4. It does not accept a new document whose tenant ID is not the ID of the current tenant. It does not accept a change of the field `tenantId` (TC-06).

A read of a document of another tenant thus gives no document. The API of a feature then answers as for a document that does not exist (TC-07). A request body has no tenant field, because the repository takes the tenant ID from the current tenant (TC-06).

In the cloud mode the connection resolver has no MongoDB connection of a tenant before the tenant catalog feature. Step 2 then stops with the error of the connection resolver. Thus no tenant document goes to the system database (section 6.6 of the architecture document).

### The user repository and the operations at the start
The user repository uses the tenant-document access for each of its operations. The user service reads the current tenant, and its operations have no tenant parameter. The completion runner and the lock task call the user service inside the tenant runner. The lock task runs in the self-host mode only (plan decision 6).

These 3 operations stay outside the tenant-document access, and the build rule of section 6.9 of the architecture document lists them:

- The wizard runs before Spring. It reads the admin and writes the admin marker with its own client, and it gives the tenant ID `self-host-tenant` to each operation.
- The completion runner reads the admin marker by its document ID, which is the tenant ID. The admin marker is the handover of the wizard in a self-host installation.
- The start checks of the root key read the `keys` collection of the yml database without a tenant. They are checks of the installation (decision 14).

### The log line
The defaults post-processor of `core.config` gives a default to the Spring property `logging.pattern.correlation` (plan decision 5). The default pattern prints the MDC key `tenant`. For a thread without a bound tenant the pattern prints `self-host-tenant` in the self-host mode and `-` in the cloud mode. Thus each application log line of a self-host installation has the tenant ID, also a line of the start. The default patterns of Spring Boot for the console and for the log file contain the correlation pattern. The threads of the engine have no bound tenant: their log lines carry the execution ID (decision 8).

## Modules and packages
The feature adds no module. The package `core.tenant` is the package that section 3.4 of the architecture document gives to the tenant catalog.

| Package | Content | Why this module |
|---|---|---|
| `common.tenant` | The tenant identifier and the check of a tenant ID from outside core | They are contracts without a framework dependency. The job message, the events and each client use the same form. |
| `core.tenant` | The current tenant, the tenant runner, the principal contract, the request filter, the task decorator and the tenant-document access | A lower module is not possible. The engine and the transports have no tenant logic (section 6.3). The module `common` holds contracts only, and these blocks use the servlet API, Spring and MongoDB. Only the request filter reads the principal contract. |
| `core.user` | The user repository on the tenant-document access, the user service without a tenant parameter, and the lock task for the self-host mode | The feature of the OpenCelium users owns its repository (plan decision 4). |
| `core.config` | The default of the log pattern in the defaults post-processor | The defaults post-processor owns each default of a bootstrap value. |
| `core.setup` | The completion runner calls the user service inside the tenant runner | The completion runner follows the user service. |

The feature is in core only. Thus the monolith and the distributed shape get the same behaviour. The engine and the worker get no tenant logic. The tenant ID goes out in the job message and comes back in each event (decision 11).

## Decisions
The reviewer confirms each decision before task 1 starts.

1. **A scoped value holds the bound tenant.** How does core hold the bound tenant of a thread? Options: (a) a scoped value of Java 25, (b) a thread-local variable. Recommended: (a), because a scoped value has its value only during the task of the tenant runner. A thread of a pool cannot keep the tenant for the next task, and code inside the task cannot change it. The 2 options must have the task decorator for a task on another thread.
2. **The self-host mode binds its tenant on the same path.** Where does the current tenant come from in the self-host mode? Options: (a) the fixed value `self-host-tenant` for all work, without a bound tenant, (b) the path of the cloud mode, with `self-host-tenant` as the bound tenant. With (b), the request filter and each background task bind the tenant through the tenant runner. Recommended: (b), because decision 11 gives the self-host mode the same code path with 1 static tenant. A bind that code omits then shows in the self-host mode, which gets the hand tests. With (a), such a defect shows only in the cloud mode. The cost of (b) is 1 call of the tenant runner in the completion runner and 1 call in the lock task. Candidate for section 7 of the architecture document; the architect agent drafts the record.
3. **The tenant-document access applies the tenant limit.** Where does core apply TC-06, TC-07 and TC-08? Options: (a) 1 tenant-document access in `core.tenant` for all repositories, (b) the tenant ID as a parameter of each query of a repository. The user repository has option (b) for 3 of its 8 operations. Recommended: (a), because the limit then has 1 place and a repository cannot omit it. Decision 11 gives each tenant its own database in the cloud mode. With (a), the choice of the database and the tenant limit read the same current tenant. With (b), a parameter and the current tenant can name 2 different tenants. Candidate for section 7 of the architecture document; the architect agent drafts the record.
4. **The repositories are in the package of their feature.** Where do the repositories of the tenant documents go? Options: (a) in the core package of each feature, on the tenant-document access of `core.tenant`, (b) in 1 shared persistence package. Recommended: (a), because each feature stays self-contained and the features share only the tenant limit. The repositories of the OpenCelium users, of the wrapped DEKs and of the admin marker are in their feature packages. This decision closes the open decision "Where the Mongo repositories go" of section 7.
5. **The default log pattern prints the tenant ID.** How does the tenant ID get into each application log line (TC-09)? Options: (a) the MDC key `tenant` and a default of `logging.pattern.correlation`, (b) an own Logback configuration file with a converter that reads the current tenant. Recommended: (a), because core adds no Logback file and no class of the log library. The operator keeps the standard Spring properties for the log. With (b), the converter must read the deployment mode from a static field, because Logback makes the converter and Spring does not. Candidate for section 7 of the architecture document; the architect agent drafts the record.
6. **The lock task runs in the self-host mode only.** What does the lock of an OpenCelium user with an old generated password do in the cloud mode? Options: (a) it does not run, (b) it runs and stops with the error of TC-08 at each run. Recommended: (a), because the Service Portal owns the OpenCelium users in the cloud mode (decision 10). A task for all tenants is also out of scope of the spec.

## Interfaces and contracts
The feature has no endpoint, no SPI change, no runtime setting, no `opencelium.*` property and no new dependency.

- **The tenant identifier** (`common.tenant`). It accepts a value with the form of rules 1 to 3 of TC-05. Each other value is an error.
- **The check of a tenant ID from outside core** (`common.tenant`). It applies rules 1 to 4 of TC-05 and gives the tenant identifier or an error.
- **The current tenant** (`core.tenant`). It gives the tenant identifier of the work, or the error "no current tenant".
- **The tenant runner** (`core.tenant`). It runs 1 task for 1 tenant. The 3 cases without a start are in "The current tenant and the tenant runner".
- **The principal contract** (`core.tenant`). A principal gives its tenant ID. The authentication feature implements the contract.
- **The request filter** (`core.tenant`). A servlet filter after the security filter chain.
- **The task decorator** (`core.tenant`). A bean that Spring Boot applies to the application task executor and to the task scheduler.
- **The tenant-document access** (`core.tenant`). Its operations are: read 1 document, read many documents, count, insert, change and delete. Each operation takes a document type and a condition.
- **The tenant-document contract** (`core.tenant`). A tenant document gives its tenant ID. Its collection holds the ID in the field `tenantId`.
- **The MDC key `tenant`.** It holds the ID of the bound tenant. An operator with an own log pattern prints it with `%X{tenant}`.
- **The bootstrap property `logging.pattern.correlation`.** Spring owns the property, so it keeps its standard name. Question 1 of section 6.4 of the architecture document gives the yml file. The log pattern applies from the first log line, before core can reach a database. The default is `[%X{tenant:-self-host-tenant}] ` in the self-host mode and `[%X{tenant:--}] ` in the cloud mode. The start writes a `(default)` line for it, and the sample yml file gets 1 comment line.

## Test strategy
Each test that touches MongoDB is a full-application test against the local MongoDB, with `LocalMongo` and `MongoIntegrationTest` of `testsupport`. The module `common` gets unit tests only.

| Criterion | Tests |
|---|---|
| TC-01 | A unit test of the tenant runner in the self-host mode, with `self-host-tenant` and with another tenant ID. A full-application test: a request to a test endpoint answers with `self-host-tenant`. |
| TC-02 | A full-application test in the cloud mode with MockMvc and a fake principal. A tenant ID in a header, in a parameter and in the body does not change the answer of the test endpoint. A request without a principal has no current tenant. A unit test makes sure that the principal of a WebSocket session gives the same tenant. |
| TC-03 | A unit test in the 2 modes: the tenant runner runs a task for the tenant ID of a fake record, without a principal. |
| TC-04 | A unit test of the task decorator with 2 threads. A full-application test: a task on the application task executor has the tenant of its caller. |
| TC-05 | A unit test in `common` with a table of good values and bad values. A unit test of the tenant runner with the reserved values. |
| TC-06, TC-07 | A full-application test in the self-host mode. The test writes documents of 2 tenant IDs with the plain driver. Then it reads, changes and deletes through the tenant-document access. A write through the test endpoint with a tenant ID in the body gives a document with the current tenant. The tests of the user repository make sure that each of its operations has the tenant limit. A full-application test in the cloud mode makes sure that an insert for a tenant without a database stops. The test also makes sure that no tenant document goes to the system database. |
| TC-08 | A unit test of the current tenant without a bound tenant. A full-application test in the 2 modes: an operation of the tenant-document access without a bound tenant stops, and no document changes. |
| TC-09 | A full-application test with the captured log output in the 2 modes. A unit test of the default of the log pattern for each deployment mode. |

The tests use these fakes and fixtures of `testsupport`:

- A fake principal that gives a tenant ID.
- A test endpoint that answers with the current tenant and writes 1 test document.
- A test document type with the field `tenantId`, for the tests of the tenant-document access.
- A cloud start: the system database from `LocalMongo` and a master key file in a temporary directory.

## Risks
| Risk | How the plan handles it |
|---|---|
| Core has no authentication, so no real principal gives a tenant. | The principal contract and the fake principal test TC-02. The authentication feature implements the contract and adds the test with a session JWT. |
| Core has no WebSocket gateway. | The tenant runner is the 1 entry for a session. The gateway feature calls it and adds the test with a session. |
| A tenant has no database in the cloud mode before the tenant catalog feature. | The tenant-document access stops with the error of the connection resolver. The tests of TC-06 and TC-07 run in the self-host mode with 2 tenant IDs in 1 database. |
| The principal path of the cloud mode has no hand test before the authentication feature. | The request filter, the tenant runner and the task decorator run in the self-host mode at each hand test. The tests of TC-02 run in the cloud mode at each build. |
| Code of the start or a scheduled task omits the call of the tenant runner. | The work stops with the error of TC-08 in the 2 modes. Thus a hand test of a self-host installation shows the defect. |
| A repository reads a tenant document without the tenant-document access. | Section 6.9 of the architecture document gets a build rule for it. The reviewer examines the rule by hand, as for the 4 rules of that section. |
| Core starts a thread without the task decorator. | The work on a tenant document stops with the error of TC-08 in the 2 modes, so the defect is visible. |
| An operator sets an own log pattern or the structured log format. | The sample yml file names the MDC key `tenant`. The structured format writes each MDC key. |
| A library for traces sets `logging.pattern.correlation` at a later time. | The feature that adds the library puts the 2 patterns together. |
| The wizard calls the defaults post-processor before Spring. | A test of the wizard makes sure that the default of the log pattern does not show on a screen. |

## Definition of done
- Each criterion of spec.md has a test that passes.
- `./gradlew build` is green.
- The hand tests of tasks.md are done.
- The architecture document and the writing guide are updated when the plan changes them.
- Section 7 of the architecture document has the decision record of the current tenant and the decision record of the repositories. The open decision "Where the Mongo repositories go" is not in the list of the open decisions.
- Sections 3.4 and 6.3 of the architecture document name the blocks of `core.tenant`. Section 3.4 names the self-host mode for the lock task.
- Sections 4.1 and 6.4 of the architecture document name the default of the log pattern.
- Section 6.9 of the architecture document has the build rule for the tenant documents, with its 3 exceptions. Section 8 of CONTRIBUTING.md names the same rule.
- No repository of a tenant document has a query without the tenant limit.
