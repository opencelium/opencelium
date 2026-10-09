# Writing guide for the documents

All Markdown documents in `docs/` and all tickets are written in ASD-STE100 Simplified Technical English (STE). This guide lists the rules that the project applies and the technical names that it permits. Code, Javadoc, and commit messages follow [CONTRIBUTING.md](../CONTRIBUTING.md), not this guide.

## Language rules

- Use approved words only. Examples: *must* (not *should*), *can* (not *may* or *might*), *make sure* (not *ensure* or *verify*), *permit* (not *allow*), *make* (not *create*), *give* (not *provide*), *through* (not *via*), *for example* (not *e.g.*). Do not write *etc.*: list the items.
- Use the active voice, the simple present for descriptions, and the imperative for instructions.
- Do not use -ing verb forms, perfect tenses, idioms, or contractions.
- Put an article before each noun.
- A sentence in a description has 25 words or less. A sentence in a procedure or in an acceptance criterion has 20 words or less.
- A paragraph has one topic and 6 sentences or less.
- Use a vertical list for 3 or more items.
- Write numbers as numerals.

## Names and references

- Name a building block by its responsibility, for example *the connection resolver*. Do not name a Java class or interface. A code identifier appears only when it is a contract for an operator or for the build: a property, an environment variable, a jar, a port, a collection, or a package. A product or framework name that marks a selected technology, for example Spring RestClient or Quartz, is a technical name.
- Do not name Jira tickets in a document, because ticket numbers change and tickets are removed. A ticket links to a decision number or to a section heading of [architecture.md](architecture.md). A story is named by its subject, for example *the authentication story*.
- "(decision 11)" points to the numbered list in [architecture.md, section 7](architecture.md#7-architecture-decisions). The numbers do not change and are not used again.
- An architecture document gives the target design. It does not tell the state of the code, and it has no status markers, dates, or commit hashes. The code and the git history give the state.

## Technical names

STE permits technical names and technical verbs that are standard in the industry. The documents use them as they are. A new industry term that STE does not approve is added to this list before use. The groups:

- Domain: invoker, connector, workflow, node, edge, graph, DAG (directed acyclic graph), trigger, tenant, principal, Service Portal, OCEL, Global Params.
- Execution: job message, event, checkpoint, state machine, breakpoint, debugger, promise, future, virtual thread, scheduler, dispatcher, transport, snapshot, payload, codec, spool.
- Software structure: module, library, jar, package, class, bean, interface, SPI (service provider interface), API, REST, JSON, endpoint, frontend, plug-in, runtime, default, log.
- Documentation: building block, cross-cutting concept, runtime view.
- Protocols: WebSocket, JWT, OIDC, LDAP, HTTP(S), AMQP, broker, queue.
- Data: database, collection, document, client, connection pool, cluster, credential, secret, setting, property, environment variable, yml file.
- Cryptography: root key, master key, DEK (data-encryption key), envelope encryption, AES-256-GCM, IV (initialization vector), plaintext, ciphertext, crypto-shredding.
- Access control: user, group, role, ACL (access-control list), RBAC (role-based access control), token, session, claim, claim mapping, 2FA/TOTP, provisioning, onboarding, offboarding.
- Products and tools: Spring Boot, Gradle, MongoDB, RabbitMQ, Kafka, SQS, Quartz, ArchUnit, Testcontainers, Mockito, n8n.
- Technical verbs (1): execute, deploy, dispatch, encrypt, decrypt, wrap, unwrap, authenticate, authorize, log in, publish, subscribe, schedule, configure.
- Technical verbs (2): scan, ping, parse, map, cache, mock, inject, mount, rotate, resume, pause, delete, boot, port (code from the legacy system).
