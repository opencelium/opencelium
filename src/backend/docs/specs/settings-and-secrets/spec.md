# Settings and secrets

## User story
As an admin of a self-host installation, I want to read and change the runtime settings of core through the API, so that a change applies without a restart and no credential is kept in plaintext.

## Context
The AMQP transport of core must have the broker connection, and the connectors must have a place for their credentials. Both are values in the database, not in the yml file. This feature gives the runtime settings, the settings API and the secret storage that these features use. Sections 6.4 (configuration placement), 6.5 (secrets and keys) and 6.9 (build checks) of the architecture document apply.

## Scope
Core keeps the runtime settings and the secrets of the installation in the database. The feature does these things:

- It declares each runtime setting in the code, with its setting key, its type, its default and its rule for a valid value.
- It gives the value of each setting through the settings API. The database keeps only the values that are different from the default.
- It lets an admin change a setting through the settings API. The change applies without a restart.
- It encrypts the secret of a secret setting through the secret storage. The settings API shows a masked value and never the plaintext.
- It makes the build fail when the code breaks a build rule of section 6.9.

These terms apply in this specification:

- An **admin** is an OpenCelium user with the role `ADMIN`.
- A **runtime setting** is a configuration value in the database. The code declares it in the setting registry. In this specification "setting" means a runtime setting.
- A **setting key** is the name of a setting in the settings API, for example `broker.port`.
- The **database value** of a setting is the value that the database keeps for it. A setting without a database value has its default.
- An **installation setting** applies to the whole installation. A **tenant setting** applies to 1 tenant. Each setting of this feature is an installation setting.
- A **secret setting** is a setting key that refers to a secret (section 6.4). The settings service keeps a secret reference for it, and the secret storage keeps the ciphertext.
- The **settings API** is the endpoint `GET/PATCH /api/settings` (decision 19). A **settings request** is a request to this endpoint.
- A **core instance** is 1 process of `oc-app.jar`.
- A **control character** is a character from U+0000 to U+001F, a character from U+007F to U+009F, or a bidi control: U+202A to U+202E and U+2066 to U+2069. The start of core and the setup wizard use the same list.

The feature declares the settings of the broker connection. They have no effect on the transport in this feature:

| Setting key | Value | Default | Rule for a valid value |
|---|---|---|---|
| `broker.host` | The host name or the IP address of the AMQP broker | No value | A host name or an IP address |
| `broker.port` | The port of the AMQP broker | `5672` | A number from 1 to 65535 |
| `broker.virtual-host` | The virtual host of the AMQP broker | `/` | 1 to 255 characters without a control character |
| `broker.username` | The username of core on the AMQP broker | No value | 1 to 255 characters without a control character |
| `broker.password` | The password of core on the AMQP broker, a secret setting | No value | 1 to 255 characters without a control character, and not `****` (SS-08) |

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### The settings

- **SS-01** Given a setting without a database value, when an admin reads the settings, then core must return its default. The response shows that the value is the default. A new installation has no database value.
- **SS-02** Given a valid value, when an admin changes a setting, then core must return the new value without a restart. These rules apply to the change:
  1. The next read through each core instance returns the new value.
  2. If the new value is the default, core deletes the database value.
  3. For a secret setting, the response shows the value of SS-08.
  4. For a secret setting, core deletes the ciphertext of the replaced secret.
- **SS-03** Given an unknown setting key or an incorrect value, when an admin changes settings, then core must change no setting. The response has the status code 400 and names each incorrect setting key. A request with 1 incorrect value changes no setting of that request.
- **SS-04** Given a setting with a database value, when an admin resets the setting, then core must delete that value. To reset a setting, the request gives the JSON value `null` for its setting key. The next read returns the default. For a secret setting, core also deletes the ciphertext.
- **SS-05** Given an OpenCelium user without the admin role, when the user sends a settings request, then core must refuse it. The response has the status code 403. A request without a valid session JWT gets the status code 401 (decision 19).
- **SS-06** Given the cloud mode, when an OpenCelium user sends a request for an installation setting, then core must refuse it. The response has the status code 403, also for an admin of a tenant (open question 2).

### The secrets

- **SS-07** Given a secret setting, when an admin sets its secret, then the database must hold only the ciphertext. No collection, no response, no error and no application log line holds the plaintext (open question 4).
- **SS-08** Given a secret setting with a secret, when an admin reads the settings, then the response must show `****`. These rules apply to the masked value:
  1. The response to a change of a secret setting also shows `****`.
  2. A secret setting without a secret shows no value.
  3. No API returns the plaintext of a secret.
  4. A change that gives `****` as the value of a secret setting gives an incorrect value (SS-03). Thus a client that sends back a read does not replace the secret. To keep a secret, a change leaves out its setting key.

### The build rules

- **SS-09** Given a class that breaks a build rule, when the build runs, then the build must fail. The report names the rule and the class. The build rules are the 5 rules of section 6.9, with the 3 exceptions of that section. The new decision on the cryptography rule gives the limit of that rule.

## Out of scope
- The effect of the broker connection on the transport, and the broker address of the workers. The AMQP transport feature gives them (decision 4). The first feature that dispatches an execution applies the detection rule of decision 4.
- The change notifications of the settings service. No component reads a setting in this feature. The first feature with a component that subscribes gives them, and also tells how a change reaches another core instance.
- The tenant settings. The first feature with a tenant setting gives them.
- The secrets of a tenant under the DEK of that tenant, and the generation of that DEK. The first feature with a secret of a tenant gives them, for example the connector feature.
- The settings path for the operator of a cloud installation (open question 2).
- The settings screen of the frontend.
- The rotation of the root key or of a DEK, and a new encryption of the secrets.
- Other secret providers, for example Vault.
- The secret references in OCEL for the raw request node.
- An audit record for a change of a setting.
- The bootstrap values of the yml file. Decision 13 keeps them in the yml file.
- The ArchUnit rules for the boundaries of the feature packages (decision 1).

## Decisions that apply
- Decision 13 of the architecture document: the feature gives the setting registry, the settings service, the `settings` collection and the secret storage. The `settings` collection holds only the values that are different from the default (SS-01, SS-02).
- Decision 13 and section 6.9: the `settings` collection is read only through the settings service (SS-09).
- Decision 14: the secret storage uses envelope encryption with AES-256-GCM, a new IV for each secret, and key versions. The root key stays outside the database.
- Decisions 11 and 17: the system DEK exists from the first start in the 2 modes, and it already encrypts the catalog credentials. Thus the feature generates no DEK.
- Decision 4: the broker connection is a runtime setting, and no property sets the transport. This feature gives the settings, and the AMQP transport feature reads them.
- Decision 9: a worker reads no database setting. The workers get the broker address from the environment or from the yml file.
- Decision 15: a settings request runs with a bound current tenant, but an installation setting belongs to no tenant.
- Decisions 7, 10 and 18: the settings API needs the admin role (SS-05). The role comes from the session JWT, and no security filter has the role check. The detailed RBAC design stays open.
- Decision 19: the settings API has the path `/api/settings`, and its errors have the problem-details form with an error code.
- A new decision is necessary for the owner of a setting and of a secret. The decision gives these items:
  1. The installation or a tenant as the owner.
  2. The database that keeps the settings and the secrets of each owner.
  3. The DEK that encrypts a secret of the installation.
  4. That the settings and the secrets of the installation belong to no tenant, the same as the tenant catalog, and their relation to section 6.9.

  The architect agent drafts it.
- A new decision is necessary for the limit of the cryptography rule of section 6.9. The decision tells if the rule applies to the password hash and to a random value that is not a key (SS-09). The architect agent drafts it.

## Open questions
1. Which settings does the first version of the settings API give? Assumption until the answer comes: only the broker connection, which has no effect until the AMQP transport feature (assumption).
2. In the cloud mode, who changes an installation setting? Assumption until the answer comes: no OpenCelium user can change it through the settings API, and a later operator feature gives a path (assumption).
3. Can an OpenCelium user without the admin role read the settings? Assumption until the answer comes: no, only an admin can read them (assumption).
4. Does the rule of SS-07 for the application log apply at each log level? Assumption until the answer comes: the rule applies at the default log level INFO. At the log level DEBUG, a library can write the body of a request (assumption).
5. Is the broker username a secret? Assumption until the answer comes: no, only the broker password gives access, so only the password is a secret setting (assumption).
