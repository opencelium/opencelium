# Settings and secrets: the plan

## Approach
Core keeps the installation settings in 1 document of the `settings` collection, in the database that the yml file names (plan decision 1, record 20 of the reviewer). The setting registry collects the setting definitions of the features, and the settings service reads and changes the values. The settings API gives the values to an admin of a self-host installation. The authorization manager of Spring Security examines the role (plan decision 4). The secret storage encrypts the secret of a secret setting under the system DEK and keeps the ciphertext in the `secrets` collection (plan decision 7). ArchUnit tests make the build rules of section 6.9 build failures. The sections below give the build order, and each section ends in a state where `./gradlew build` is green.

### The setting registry
A setting definition has these parts:

- the setting key
- the type: text, integer, host, or secret
- the default, or no value
- the rule for a valid value

Each setting of this feature is an installation setting (record 20). Thus a definition has no part for the owner, and the first feature with a tenant setting adds it.

The table of the spec gives the definitions of the broker connection and their rules. The registry collects each definition bean of the Spring context at the start (plan decision 2). A setting key that 2 definitions declare stops the start, and the message names the key.

The type gives the form of a JSON value:

- A text value and a secret value are JSON strings.
- An integer value is a JSON number without a fraction.
- A host value is a JSON string with a host name or an IP address. The rule examines the form only and does no DNS lookup. A host name has at most 253 characters, in labels of 1 to 63 letters, digits and hyphens. An IP address is an IPv4 address or an IPv6 address.

A value of another JSON type is not valid, for example the JSON string `"5672"` for an integer.

### The settings document
The `settings` collection holds 1 document for the installation, with the ID `installation`. The document has 1 field for each database value, under the path of its setting key: `broker.host` is the field `host` in the subdocument `broker`. A setting without a field has its default (SS-01). A new installation has no document.

The document is data of the installation, not a tenant document (record 20). Thus the settings repository of `core.settings` uses the template of the database that the yml file names, the same as the signing-key loader.

### The settings service
The settings service has these operations:

- **Read.** It reads the document and gives each setting with its value and a mark for the default (SS-01). It keeps no cache (plan decision 3). Thus the next read through each core instance gives a changed value (SS-02).
- **Change.** It takes a map of setting keys to new values. It examines each key and each value first. If 1 key or 1 value is not valid, it changes nothing and names each incorrect key (SS-03). Then it changes the document in 1 update: a set for each new value, and an unset for each value that is the default or `null` (SS-02, SS-04).
- **The value of 1 setting.** A feature reads 1 setting through the service. For a secret setting the service gives the secret reference and never the plaintext. The feature reads the plaintext from the secret provider at the moment of use (decision 13).

### The settings API
The settings controller of `core.settings` has the 2 endpoints of "Interfaces and contracts". The response of a read and of a change has the same form: each setting key with its value and its mark for the default. A secret setting with a secret shows `****`, and a secret setting without a secret shows `null` (SS-08). An exception handler of `core.settings` writes the errors of this feature in the problem-details form (decision 19). An error text names a setting key, but never a value of the request.

A change reads its body itself, after the method security passed the rule: Spring MVC reads a request body before the method security runs. Thus a user without the permission gets 403 for each JSON body (SS-05, SS-06), and core reads at most 64 KB of a body. A body of another media type gets 415 from Spring MVC before the rule. Core zeroes the bytes of the body after the parse.

### The authorization
`core.auth` gives each role of a session JWT to Spring Security as the authority `ROLE_<role>`. The principal keeps its roles. `core.authz` declares the method security of Spring Security and the rule "installation admin" (plan decision 4):

- In the self-host mode an OpenCelium user with the role `ADMIN` passes the rule.
- In the cloud mode no OpenCelium user passes the rule (SS-06).

The 2 endpoints of the settings controller need the rule. A request that does not pass gets the status code 403. The access-denied handler of the main chain writes the response with the code `access-denied` (plan decision 5). A request without a valid session JWT gets the status code 401 from the main chain (SS-05).

### The secrets
The secret contract of `common.secret` has the secret provider SPI and the secret reference (plan decision 6). A secret reference holds the owner and the secret ID. Its text form does not show a value. The owner of a secret of the installation is the reserved tenant ID `system`.

The secret storage of `core.secrets` implements the SPI (plan decision 7):

1. **Store.** It reads the newest DEK of the owner, makes a new secret ID and a new IV, and encrypts the plaintext with AES-256-GCM. The associated data holds the owner, the secret ID and the DEK version. It inserts the ciphertext into the `secrets` collection and gives the secret reference.
2. **Read.** It reads the document of the reference, unwraps the DEK of the recorded version, and decrypts the ciphertext. The caller zeroes the plaintext after use.
3. **Delete.** It deletes the document of the reference.

The DEK access of `core.secrets.keys` reads and unwraps the DEK of an owner for 1 operation and then zeroes it. The signing-key loader uses the same DEK access. For the owner `system` the DEK is the system DEK, which exists from the first start (decision 17). Thus this feature generates no DEK. An owner without a DEK stops the operation, because a DEK of a tenant is out of scope.

A change of a secret setting has 3 steps in this order:

1. The secret storage stores the new secret.
2. The settings service sets the new secret reference in the document. The update gives the old document, so the service knows the replaced reference.
3. The secret storage deletes the replaced secret.

A reset of a secret setting does steps 2 and 3 without step 1 (SS-04). If core stops between 2 steps, a ciphertext without a reference stays in the collection. It holds no plaintext (risk table).

### The build rules
The ArchUnit tests of each module are in the test sources of that module, in its base package (decision 5). Each test imports the classes of its module without the test classes. The tests of `common`, `execution` and `worker` examine rules 1 and 2. The test of `core` examines the 5 rules, because only core has `@Document` classes, settings and tenant documents. The 5 rules of section 6.9 have these limits:

1. **No `@Value`.** No class uses the annotation `@Value` of Spring.
2. **Cryptography only in `core.secrets`.** No class outside `core.secrets` uses key material. Thus no class of `common`, `execution` and `worker` uses key material. These types are key material:
   - each type of the packages `javax.crypto` and `org.springframework.security.crypto.encrypt`, also in a package below them
   - each type of the packages `com.nimbusds.jose.crypto`, `com.nimbusds.jose.jwk`, `com.nimbusds.jose.proc` and `com.nimbusds.jwt.proc` of Nimbus, also in a package below them
   - the types `JWSSigner`, `JWSVerifier`, `JWEEncrypter` and `JWEDecrypter` of Nimbus, and each type that implements them
   - the type `Key` of `java.security` and each type that implements it
   - the types `KeyPair`, `KeyFactory`, `KeyPairGenerator`, `KeyStore` and `Signature` of `java.security`
   - in `core`, the root key, the DEK access and the DEK wrapper of `core.secrets.keys`. They give the bytes of the root key and of a DEK.

   The setup wizard writes the master key through the root-key generator, which zeroes the key. Thus the wizard holds no key material. Only `core.secrets.keys` gets a root key from the root-key generator or the root-key resolver. The password hash and a random value that is not a key are outside the rule (record 21 of the reviewer).
3. **No plaintext secret-named fields.** The rule examines each stored field. A stored field is an instance field of 1 of these classes:
   - a `@Document` class, or a tenant document without the annotation
   - a class of the code of OpenCelium that a class of this list extends
   - a class of the code of OpenCelium that extends or implements a class of this list, also in another module. Spring Data stores the fields of the class of the value.
   - a class of the code of OpenCelium in the type of a stored field, also as a type argument or an array element. This class is a subdocument, and the rule also examines a subdocument in a subdocument.

   A stored field that holds text or bytes must have a name without a secret word. The rule also permits a name that ends with `Hash` or `Id` (plan decision 10). Text or bytes is a `String`, a `char[]` or a `byte[]`, alone, in a `Collection`, an `Optional` or an array, or as a `Map` value. A field with the type of the secret reference passes, because the reference holds only the owner and the secret ID. MongoDB does not store a static field, so the rule does not examine it. A field of another type that can hold text or bytes is outside the rule, for example `Object`, `CharSequence` or the BSON type `Binary`.
4. **The `settings` collection only through the settings service.** Only the settings service and the Spring configuration of `core.settings` use the settings repository. The repository is package-private, so the compiler also stops a class of another package. A class that rule 5 does not name and that reads the `settings` collection through the Mongo template or the driver breaks rule 5.
5. **Tenant documents only through the tenant-document access.** Each class that the rule does not name keeps to these limits (plan decision 9):
   - It calls no method and no constructor of the Mongo template of Spring Data, and it has no method reference to the template. The fluent operations, the types in them and the bulk operations of the template are part of the template. The index operations are outside the rule.
   - It uses no collection, no database and no client of the MongoDB driver.
   - It uses no other reader of Spring Data MongoDB: the repository support, a message listener, GridFS, a reader of a referenced document, or the database factory.
   - It is not a repository of Spring Data, and it is not an interface with the annotation `@RepositoryDefinition`.

   The rule names each class that is outside it. A named class must keep only the data of its group. If it gets a tenant document, it uses the tenant-document access. The groups:
   - the tenant-document access of `core.tenant`
   - the MongoDB connection of `core.config.mongo`: the client, the factory of the clients and the ping at the start. They read no document.
   - the data of the installation (record 20): the settings repository, the secret storage and the DEK access. In this feature, the DEK access reads only the system DEK.
   - exception 1 of section 6.9, the wizard: the check for an admin, the check for a wrapped DEK, and the write of the admin marker. The wizard has its own MongoDB client.
   - exception 2 of section 6.9: the repository of the admin markers, which the completion runner uses
   - exception 3 of section 6.9: the repository of the wrapped DEKs and the signing-key loader

For each rule, 1 test examines the code of its module, and the rule passes. Each sample class that breaks a rule has 1 test: the rule fails, and the report names the rule and the class (SS-09). A sample class at a limit of a rule makes sure that the rule passes on it, for example a password hash. The sample classes are test classes, so the test of the code of a module does not import them. They are in the package `io.opencelium.buildrules`, but the sample of rule 4 is in `core.settings`, because the settings repository is package-private. In `common`, rule 1 has no sample class, because `common` has no Spring, and the compiler refuses `@Value`.

## Modules and packages
The feature adds no module.

| Package | Content | Why this module |
|---|---|---|
| `common.secret` | The secret provider SPI and the secret reference | Section 3.2 puts the secret contract here. |
| `core.settings` | The setting registry, the definitions of the broker connection, the settings document, its repository, the settings service, the settings controller and its errors | Section 3.4 puts the settings here. A lower module is not possible: `common` and `execution` have no database, and a worker reads no setting (decision 9). |
| `core.secrets` | The secret storage, the secret document and its repository | Section 3.4 puts the secret storage here, and the build rule of section 6.9 permits cryptography only in `core.secrets`. |
| `core.secrets.keys` | The DEK access for 1 operation, which the secret storage and the signing-key loader use | The root key and the DEK wrap are in this package (section 3.4). |
| `core.authz` | The method security and the rule "installation admin" | Section 3.4 puts the access control here (decision 7). |
| `core.auth` | The authorities from the roles of a session JWT, and the access-denied handler of the main chain | The security filter chains are in this package (section 3.4). |
| Each module (tests) | The ArchUnit tests of the build rules: rules 1 and 2 in `common`, `execution` and `worker`, the 5 rules in `core` | A test is in the module of the code that it tests (decision 5). |

The package `core.settings` depends on `common.secret`, `core.authz`, the yml template of `core.config.mongo`, and the control-character rule of `core.config` that the start of core and the setup wizard also use. The package `core.secrets` depends on `common.secret` and `core.secrets.keys`. No package of this feature depends on `core.settings`.

The broker definitions are in `core.settings`, because no feature reads them yet. The AMQP transport feature reads them through the settings service. Where the transport implementations go is an open decision of section 7, and that feature closes it.

The feature is in core only. Thus the monolith and the distributed shape get the same behaviour. A worker reads no setting and no secret of this feature (decision 9).

## Decisions
The reviewer confirms each decision before task 1 starts.

1. **1 document for the installation settings.** How does core keep the database values, so that a change of more than 1 setting changes all or nothing (SS-03)? Option (a): 1 document for the installation, with 1 field for each database value. Option (b): 1 document for each setting key. Option (c): option (b) with a transaction over more than 1 document. Recommended: (a), because 1 update of 1 document changes all fields or no field. Option (b) can stop after a part of the writes. Option (c) needs a replica set, and the MongoDB server of a self-host installation can be a single server. Candidate for section 7 of the architecture document; the record of plan decision 7 carries it.
2. **The setting definitions are beans, and the registry collects them.** How does a feature declare a setting? Option (a): each feature declares its settings as beans of the definition type, and the registry collects them at the start. Option (b): 1 central list of all setting keys in `core.settings`. Recommended: (a), because a feature then owns its settings, and `core.settings` knows no feature (decision 1). The registry stops the start for a duplicate setting key. The broker definitions are in `core.settings` until the AMQP transport feature reads them. Candidate for section 7 of the architecture document; the record of plan decision 7 carries it.
3. **The settings service keeps no cache.** How does a changed value reach each core instance (SS-02)? Option (a): the service reads the document at each read. Option (b): a cache with the change streams of MongoDB. Option (c): a cache that reads the document again after a fixed time. Recommended: (a), because no component reads a setting often in this feature. Option (b) needs a replica set. The first feature with a component that subscribes decides on a cache and on the change notifications (spec, out of scope).
4. **The roles are authorities, and method security examines them.** Where does core examine the role of SS-05 and the mode of SS-06? Option (a): `core.auth` gives each role as the authority `ROLE_<role>`, and `core.authz` declares the method security of Spring Security with the rule "installation admin". Option (b): the settings controller reads the roles from a public principal contract. Option (c): a rule for the path in the main chain. Recommended: (a), because the authorization manager of Spring Security is then the 1 place of enforcement that the ACL story extends (decision 7). Option (b) puts a role check into each feature. Option (c) puts permission logic into a security filter chain, and decision 10 does not permit that. Candidate for section 7 of the architecture document; the architect agent drafts the record.
5. **1 response form for a refused permission.** Which body has a response with the status code 403? Option (a): the access-denied handler of the main chain writes the problem-details form with the code `access-denied`. Option (b): each feature writes its own response. Recommended: (a), because method security refuses a request before the code of the feature runs. Thus 1 handler gives each later feature the same response. Candidate for section 7 of the architecture document; it extends decision 19 and changes 1 clause of it.
6. **The owner of a secret is a tenant ID, with `system` for the installation.** How does a secret reference name its owner? Option (a): the tenant ID of `common.tenant`, with the reserved value `system` for a secret of the installation. Option (b): an own owner type with 2 forms, the installation and a tenant. Recommended: (a), because the wrap of the system DEK already authenticates `system` as the tenant ID (decision 17). The DEK access then finds the DEK of each owner in 1 way. The SPI has 3 operations: store, read and delete. Read gives the plaintext as bytes, and the caller zeroes them. Candidate for section 7 of the architecture document; the record of plan decision 7 carries it.
7. **The secret storage keeps each secret of the installation in the `secrets` collection.** Where does the ciphertext of a secret go? Option (a): 1 document for each secret of the installation in the collection `secrets`, in the database that the yml file names. The collection of the secrets of a tenant stays open, the same as the collection of the tenant settings (record 20). Option (b): the ciphertext in the field of the setting. Option (c): the collection `keys`. Recommended: (a), because a domain document then holds only the reference (decision 13), and a later secret provider replaces the storage without a change of the settings. Option (c) is not possible, because the start checks read each document of `keys` as a wrapped DEK. The secret document holds the owner, the DEK version, the IV, the ciphertext and the time. The associated data holds the owner, the secret ID and the DEK version. Thus a ciphertext that a person copies to another secret ID or another owner does not decrypt. Candidate for section 7 of the architecture document; the architect agent drafts the record.
8. **ArchUnit is a new test dependency.** How do the build rules become build failures (SS-09)? Option (a): the test dependency `com.tngtech.archunit:archunit-junit5` in each module, through the root build file. Option (b): own tests that read the classes with reflection. Recommended: (a), because section 6.9 names ArchUnit, and ArchUnit reads the calls and the dependencies of each class. The BOM of Spring Boot does not set the version of ArchUnit, so the root build file pins it.
9. **The rule for the tenant documents examines each read and each write of a collection.** What does rule 5 of "The build rules" stop? Option (a): the rule stops 3 uses outside the named classes. They are a call of the Mongo template other than the index operations, the driver, and a repository or another reader of Spring Data. The rule names each class of the data of the installation that is outside it. Option (b): each use of the Mongo template outside `core.tenant`. Option (c): option (a) with whole packages outside the rule, for example `core.settings`. Recommended: (a), because the index classes of `core.user` and `core.auth` use the template only for their indexes, and option (b) stops them. The data of the installation is outside the rule (record 20). Option (c) also passes the tenant settings and the secrets of a tenant that these packages get later. Candidate for section 7 of the architecture document; the architect agent drafts the record.
10. **The list of secret words for rule 3.** Which field names does rule 3 examine? Option (a): a name that holds `password`, `secret`, `token`, `credential`, `apikey`, `privatekey` or `passphrase`, without a difference of upper case and lower case. The rule permits a name that ends with `Hash` or `Id`, for example a password hash and a token ID. Only a stored field that holds text or bytes counts. Option (b): only the exact names `password` and `secret`. Recommended: (a), because the fields of an API key and of a token are as dangerous as a password. A field of the type boolean cannot hold a secret, for example the mark for a generated password. Candidate for section 7 of the architecture document; the record of plan decision 9 carries it, and section 6.9 points to it.

11. **The error `invalid-settings` has a list of the incorrect setting keys.** How does the HTTP client find each incorrect setting key of SS-03? Option (a): 1 more field `errors` in the problem-details body, with 1 item for each incorrect key: the key and the problem. Option (b): 1 error response for the first incorrect key only. Option (c): the keys in the text of the error. Recommended: (a), because SS-03 names each incorrect key, and the HTTP client reads a field and not a text (decision 19). Option (b) makes the admin send the change again for each key. Candidate for section 7 of the architecture document; the record of plan decision 5 carries it, and it extends decision 19.

## Interfaces and contracts

### Endpoints

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/api/settings` | Read the settings (SS-01, SS-08) | The rule "installation admin" (plan decision 4) |
| `PATCH` | `/api/settings` | Change or reset settings (SS-02 to SS-04, SS-07) | The rule "installation admin" (plan decision 4) |

- The response of the 2 endpoints is 1 JSON object. It has 1 field for each setting key, and each field is an object with `value` and `default`. Example: `{"broker.port": {"value": 5672, "default": true}}`.
- The body of a change is 1 JSON object of setting keys and new values. The JSON value `null` resets a setting (SS-04). The media types `application/json` and `application/merge-patch+json` are accepted. An empty object changes nothing.
- A setting key that the body does not name keeps its value.

### Error responses

| Code | Status code | When |
|---|---|---|
| `invalid-settings` | 400 | An unknown setting key or an incorrect value (SS-03). The field `errors` holds 1 object for each incorrect key, with `key` and `problem` (plan decision 11). The problem is `unknown-key` or `invalid-value`. |
| `bad-request` | 400 | A body that is not 1 JSON object, or a body longer than 64 KB |
| `access-denied` | 403 | A request that does not pass the rule "installation admin" (SS-05, SS-06) |

A request without a valid session JWT gets the status code 401, the header `WWW-Authenticate` and no body (decision 19).

### Runtime settings
The feature declares the 5 settings of the broker connection. The table of the spec gives their setting keys, defaults and rules. The 3 questions of section 6.4:

1. Core can start without a broker, so no broker setting is a bootstrap value.
2. The broker password gives access, so it is a secret setting. The broker username gives no access without the password (spec open question 5).
3. The host, the port, the virtual host and the username are runtime settings.

### Other contracts
- **The secret contract** of `common.secret`: the secret provider SPI with store, read and delete, and the secret reference with the owner and the secret ID (plan decision 6).
- **The collection `settings`.** Data of the installation, in the database that the yml file names. 1 document with the ID `installation`.
- **The collection `secrets`.** Data of the installation for the owner `system`, in the database that the yml file names. The secret ID is the document ID.
- **The authorities.** Each role of a session JWT is the authority `ROLE_<role>` (plan decision 4).
- **The new test dependency** `com.tngtech.archunit:archunit-junit5` in each module, with a version in the root build file (plan decision 8).
- **No bootstrap property.** The feature adds no `opencelium.*` property.

## Test strategy
Each test that touches MongoDB is a full-application test against the local MongoDB, with `LocalMongo` and `MongoIntegrationTest` of `testsupport`. The endpoint tests use MockMvc in the full application.

| Criterion | Tests |
|---|---|
| SS-01 | A full-application test: the default admin reads the settings of a new installation. Each setting has its default and the mark for the default, and the collection `settings` is empty. A unit test of the registry: a duplicate setting key stops the registry. |
| SS-02 | A full-application test: a change, then a read gives the new value. A change to the default removes the field. A full-application test with 2 Spring contexts on 1 database: a change through context 1, then a read through context 2 gives the new value. |
| SS-03 | A full-application test: an unknown setting key, and a change with 1 valid value and 1 incorrect value. Each gets `invalid-settings` with each incorrect key, and the document does not change. Unit tests of the rules of each type: a port of 0, of 65536 and the string `"5672"`, a host name with a label of 64 characters, an IPv6 address, and a text with a control character. A full-application test: a username with a line feed gets `invalid-settings`. |
| SS-04 | A full-application test: a reset with `null` removes the field, and the next read gives the default. The reset of the broker password also deletes its document in `secrets`. |
| SS-05 | A full-application test: an OpenCelium user without a role reads and changes the settings. Each request gets `access-denied`. A request without a token gets 401 and no body. |
| SS-06 | A full-application test in the cloud mode with `CloudStart`: a session JWT of a tenant user with the role `ADMIN` gets `access-denied`. |
| SS-07 | A full-application test: a change of the broker password. The settings document holds a reference, and the document in `secrets` holds a ciphertext. A search of each collection for the plaintext finds nothing, and the captured application log holds no plaintext. A unit test of the cipher: a new IV for each encryption, and a ciphertext with another secret ID or another owner does not decrypt. |
| SS-08 | A full-application test: the response of a change and of a read shows `****` for the broker password, and `null` without a password. A full-application test of the secret provider: a read gives the plaintext of a stored secret. |
| SS-09 | In each module, 1 ArchUnit test for each rule on the classes of the module, and 1 test for each sample class of a rule. A sample class breaks a rule or is at a limit of a rule. `common`, `execution` and `worker` have rules 1 and 2; `core` has the 5 rules. For example, a repository interface of Spring Data for a tenant document in a sample class breaks rule 5. |

The tests use these fakes and fixtures of `testsupport`:

- `LocalMongo`, `MongoIntegrationTest`, `CloudStart`, `CoreStartup` and `LoginRequests`.
- `UserFixture` for an OpenCelium user without a role.
- Spring Boot's output capture for the application log of SS-07.
- A new settings-request helper, the same as `LoginRequests`, for the 2 endpoints.
- A new session-JWT fixture. It signs a session JWT for a given tenant and roles with the signing key of the context, for the cloud test of SS-06.

## Risks
| Risk | How the plan handles it |
|---|---|
| Core stops between the store of a new secret and the change of the reference. | A ciphertext without a reference stays in `secrets`. It holds no plaintext. A later feature can delete each secret that no document refers to. |
| 2 admins change the broker password at the same time. | Step 2 of a change gives the replaced reference, so each change deletes only the secret that it replaced. |
| The JSON parser keeps the plaintext of a request as a string that core cannot zero. | The string lives only for the request. The service zeroes its byte copies, and no log line and no response holds the plaintext (SS-07). |
| The host rule does a DNS lookup and blocks a request. | The rule examines the form of the text only and uses no lookup of the JDK. |
| A rule of SS-09 fails on code that the design accepts. | Records 20 and 21 give the limits, and plan decisions 9 and 10 give the exact rules. The first run of each rule on the code of core is a test of its own. |
| The method security of Spring Security changes the order of the filters or adds a default page. | The main chain keeps its order. A full-application test makes sure that a request without a token gets 401 and a request without the role gets 403. |
| The broker settings have no effect until the AMQP transport feature. An admin expects the transport to change. | The spec says it in its scope. The hand test of the change shows only the values. |
| In the cloud mode no OpenCelium user can change an installation setting. | Spec open question 2 waits for the PM. No dispatch uses a broker yet. |

## Definition of done
- Each criterion of spec.md has a test that passes.
- `./gradlew build` is green.
- The hand tests of tasks.md are done.
- The architecture document and the writing guide are updated when the plan changes them.
- Section 7 of the architecture document has record 20 (the owner of a setting and of a secret) and record 21 (the limit of the cryptography rule).
- Section 7 has the records of plan decisions 4 (with the rule "installation admin"), 5 and 11 (the response to a refused permission and more fields of an error), 1, 2, 6 and 7 (the form of the settings and of the secrets), and 9 and 10 (the limits of the build rules), as the architect agent drafts them.
- Section 6.9 lists the 5 rules and points to the record of their limits. It names each building block that is outside rule 5.
- The list of the open decisions has 4 more entries: the change notifications of the settings and how a change reaches another core instance; who changes an installation setting in the cloud mode; the collection of the tenant settings and of the secrets of a tenant in the self-host mode; the database in which core makes the index of a tenant collection in the cloud mode.
- Section 6.4 says that 1 document holds the database values, and that a reset removes the field of the setting. Section 4.1 has the start step of the setting registry, which stops the start for a duplicate setting key.
- Section 3.4 names the blocks of this feature: the settings with the registry, the service and the API; the secret storage with the collection `secrets`; the access control with the method security.
- Section 6.4 has the 2 owners and a row for the broker username as a runtime setting. Section 6.5 and its 2 diagrams show the secrets of the installation under the system DEK, also in the self-host database. Section 6.3 and the glossary name the settings and the secrets of the installation as data of the installation. Decision 14 points to record 20.
- Section 8 of CONTRIBUTING.md has no note that the reviewers examine the 5 build rules by hand. Section 8.1 has no "Planned" note for the runtime settings and the secrets, and its step 2 says that a feature declares its setting definition in its own package.
- The writing guide has the technical names of this plan: authority, authorization manager, method security, access-denied handler, installation admin, setting definition, owner (of a setting or of a secret), and zero (a verb).
