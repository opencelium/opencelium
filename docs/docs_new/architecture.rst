##################
Architecture
##################

.. contents::
   :local:

Backend Stack
=============
- **Spring Boot entry point** – ``Application`` enables scheduling and async
  execution, runs the YAML migrator, and loads ``application.yml`` from
  ``src/backend/src/main/java/com/becon/opencelium/backend/Application.java``.
- **Module packaging** – the ``com.becon.opencelium.backend`` namespace groups
  controllers, mappers, database services (MariaDB and MongoDB), security, and
  execution logic.  Each REST controller adheres to OpenAPI annotations, so the
  generated Swagger UI remains synchronized with the runtime code.
- **Quartz & Liquibase** – Quartz is configured via ``spring.quartz`` and stores
  job metadata in MariaDB.  Liquibase applies database changesets from
  ``src/backend/src/main/resources/db/changelog``.

Data Stores
===========
- **MariaDB** keeps transactional entities (users, connectors, workflows,
  schedulers, license tracking).  Example: ``Connection`` in
  ``database/mysql/entity/Connection.java`` stores titles, connector IDs,
  enhancements, schedulers, and categories.
- **MongoDB** stores the nested workflow graphs (``database/mongodb/entity``), so
  method/operator trees can be fetched in one document.  ``ConnectorMng`` holds
  ``methods`` and ``operators``; since 5.0 there is one such container per
  workflow rather than one per side, and each ``MethodMng`` carries its own
  ``MethodConnectorMng``.
- **File-backed assets** (``src/backend/src/main/resources/invoker`` and
  ``upload-dir``) provide invoker definitions and icons referenced by connectors.

Connectors & Invokers
=====================
``ConnectorController`` exposes CRUD endpoints at ``/connector`` while guarding
against duplicate titles and cascading deletions.  It relies on:

- ``InvokerService`` to read invoker XML definitions (``invoker/*.xml``).
- ``InvokerParserImp`` to convert XML nodes into ``Invoker`` objects, including
  pagination, headers, request/response bodies, and functions.
- ``ConnectorResource`` DTOs that mirror frontend payloads.

For administrators :doc:`../usage/connectors` illustrates the UI flow for creating
credentials and icons.  This guide adds the mapping to the backend services
and explains how XML attributes (e.g., ``<body format="json"``) become ``Body``
instances consumed at runtime.

Since 5.0 icons have their own endpoints (``POST``/``DELETE
/connector/{id}/icon``); the old ``POST /storage/connector`` upload is
deprecated. ``POST /connector/check`` performs the connection test that the
workflow editor uses for its per-connector status dot.

Workflows & Field Bindings
==========================
``ConnectionController`` orchestrates both the SQL and Mongo representations.

.. note::
   The REST API and the Java packages keep the name *connection*; the UI and the
   user documentation call the same object a **workflow**.

- ``ConnectionService`` stores metadata in MariaDB.  Deleting a connector removes
  dependent workflows.
- ``ConnectionMngService`` persists the graph structure (methods, operators,
  bindings) used by the execution engine.
- ``ConnectionResource``/``ConnectionDTO`` map to the payload expected by the
  frontend's workflow editor (documented in :doc:`../usage/workflows`).
- ``EnhancementDTO`` and ``SimpleCodeDTO`` carry optional script snippets that
  run for field-by-field transformations between steps.

**The 5.0 layout.** A workflow is no longer a pair of connectors. All methods and
operators live under a single ``fromConnector`` container whose ``connectorId``
is ``-1`` and whose title is ``DEFAULT`` (see ``ConnectionConstants``);
``toConnector`` is ``null``. Every ``MethodDTO`` carries:

- ``connector`` (``MethodConnectorDTO``: ``connectorId``, ``title``,
  ``invoker``) — the connector this step calls,
- ``methodType`` (``MethodType``: ``CONNECTOR``, ``HTTP_REQUEST``, ``WEBHOOK``).
  A ``null`` value is legacy data and keeps the pre-type behaviour: the invoker is
  inferred from the enclosing connector, falling back to a plain HTTP request.

The wire values of ``MethodType`` are a frozen contract — they are persisted in
every method document and hardcoded in the UI.

``OperatorDTO`` carries both the legacy ``condition`` and the ``expression``
evaluated by the OCEL processor (``backend/ocel``). Saving an operator without an
expression is rejected with ``OPERATOR_EXPRESSION_IS_EMPTY``.

**Reading older documents.** ``versionmanager`` converts stored documents to the
current layout **on the read path, in memory** — the document on disk is
untouched until it is saved again. ``Connection50MngUpdater`` stamps each method
with its original connector, prefixes former from-side indexes with ``0_`` and
to-side indexes with ``1_`` to preserve execution order, merges everything under
one container, and leaves ``fieldBindings`` alone because they reference methods
by colour code. ``Template50Updater`` does the same for templates.

The patch endpoints (``PATCH /connection/{id}`` and ``PATCH
/connection/{connectionId}/connector/{connectorId}``) allow incremental updates
from the UI when users add methods or operators.  ``PatchHelper`` describes JSON
patch operations so the service can respond with the IDs of newly created nodes.

Test connections
================
Every test run in the editor creates a temporary connection.
``GET /connection`` and ``GET /connection/all/meta`` exclude them unless
``includeTest=true`` is passed. ``DELETE /connection/test`` removes the leftovers
on demand, and a scheduled sweeper
(``opencelium.sweeper.test-connection``) does it periodically, skipping any test
connection that is currently running.

Application configuration
=========================
``ApplicationConfigController`` (``/application-config``, ``Admin`` authority)
reads and patches the on-disk ``application.yml``:

- ``GET`` returns ``{ fields, comments }`` — a tree of ``ConfigNode``
  (``key``, ``path``, ``status`` of ``active``/``inactive``, ``value``,
  ``comments``) plus the orphan header/footer comments.
- ``PATCH`` takes the same envelope back. Nodes are matched by ``path``; values
  are edited, new keys added, and nodes with status ``inactive`` are commented
  out. The status change cascades down into contents and up through the parents
  needed to keep the file valid. ``comments`` is read-only on write; comments on
  disk are preserved.
- ``YamlConfigReader``/``YamlConfigWriter``/``YamlShadow`` implement the
  comment-preserving round-trip, ``AtomicFileWriter`` the safe write, and
  ``opencelium.config.backup`` the pre-write backups.

A restart is required for a patched configuration to take effect.

Execution & Scheduling
======================
- ``Scheduler`` entity defines cron expressions, debug flags, webhook settings,
  and notification hooks.  The UI (:doc:`../usage/schedules`) mirrors those
  attributes and surfaces live execution history.
- ``ExecutionObjectServiceImp`` builds runtime payloads for Quartz jobs by
  fetching the workflow graph, injecting proxy settings from
  ``AppYamlPath.PROXY_*`` keys, and decorating the logger with WebSocket context.
- ``WebSocketConfig`` exposes the STOMP endpoint via SockJS, restricts log
  streaming to a single scheduler per session (``schedulerId`` handshake
  parameter), and cleans up subscription state on disconnect. Behind a reverse
  proxy the ``/ws`` path has to be proxied with the ``Upgrade`` headers.

Security & Identity
===================
``SecurityConfiguration`` wires
``AuthenticationFilter`` → ``TotpAuthenticationFilter`` → ``AuthorizationFilter``
inside a stateless filter chain.

- **Local logins**: credentials live in MariaDB and are encrypted with BCrypt.
- **TOTP**: when a user enables 2FA (see ``docs_new/management/authentication.rst``)
  the backend issues QR secrets and enforces codes before JWT issuance.
- **JWT**: ``JwtTokenUtil`` signs tokens with HS256 using ``opencelium.token``
  secrets from ``application.yml``; tokens gate every REST endpoint.
- **LDAP**: optional ``spring.security.ldap`` block in ``application.yml``
  enables bind authentication with user/group filters (it was
  ``spring.data.ldap`` before 5.0).  ``LdapVerificationService`` logs failures to
  simplify troubleshooting via ``journalctl``; the debug switch is
  ``logging.level.org.springframework.security.ldap``.
- **Password reset**: ``PasswordResetController`` issues the reset link and
  accepts ``POST /auth/reset-password``; an invalid or expired token is reported
  as ``INVALID_TOKEN``.

Service Portal & Licensing
==========================
``ServicePortal`` (``service_portal/ServicePortal.java``) handles online license
activation and Service Portal themed assets.  It reads ``opencelium.service_portal``
settings (``base_url`` and ``token``).  :doc:`../management/license_management`
describes the UI workflow; this section links it to the backend REST client and the
``LicenseModule`` interface it implements.
