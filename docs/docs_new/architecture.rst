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
- **MariaDB** keeps transactional entities (users, connectors, connections,
  schedulers, license tracking).  Example: ``Connection`` in
  ``database/mysql/entity/Connection.java`` stores titles, connector IDs,
  enhancements, schedulers, and categories.
- **MongoDB** stores nested connection graphs (``database/mongodb/entity``), so
  method/operator trees can be fetched in one document.  ``ConnectorMng`` holds
  ``methods`` and ``operators`` references per connector ID.
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

For administrators :doc:`usage/connectors` illustrates the UI flow for creating
credentials and icons.  This guide adds the mapping to the backend services
and explains how XML attributes (e.g., ``<body format="json"``) become ``Body``
instances consumed at runtime.

Connections & Field Bindings
============================
``ConnectionController`` orchestrates both the SQL and Mongo representations:

- ``ConnectionService`` stores metadata in MariaDB.  Deleting a connector removes
  dependent connections.
- ``ConnectionMngService`` persists the graph structure (methods, operators,
  bindings) used by the execution engine.
- ``ConnectionResource``/``ConnectionDTO`` map to the payload expected by the
  frontend's connection designer (documented in ``docs_new/usage/connections.rst``).
- ``EnhancementDTO`` and ``SimpleCodeDTO`` carry optional JavaScript snippets that
  run for field-by-field transformations between connectors.

The patch endpoints (``PATCH /connection/{id}`` and ``PATCH
/connection/{connectionId}/connector/{connectorId}``) allow incremental updates
from the UI when users add methods or operators.  ``PatchHelper`` describes JSON
patch operations so the service can respond with the IDs of newly created nodes.

Execution & Scheduling
======================
- ``Scheduler`` entity defines cron expressions, debug flags, webhook settings,
  and notification hooks.  The UI (``docs_new/usage/schedules.rst``) mirrors those
  attributes and surfaces live execution history.
- ``ExecutionObjectServiceImp`` builds runtime payloads for Quartz jobs by
  fetching the connection graph, injecting proxy settings from
  ``AppYamlPath.PROXY_*`` keys, and decorating the logger with WebSocket context.
- ``WebSocketConfig`` exposes ``/websocket`` via SockJS/STOMP, restricts log
  streaming to a single scheduler per session (``schedulerId`` handshake
  parameter), and cleans up subscription state on disconnect.

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
- **LDAP**: optional ``ldap`` block in ``application.yml`` enables bind
  authentication with user/group filters.  ``LdapVerificationService`` logs
  failures to simplify troubleshooting via ``journalctl``.

Service Portal & Licensing
==========================
``ServicePortal`` (``service_portal/ServicePortal.java``) handles online license
activation and Service Portal themed assets.  It reads ``opencelium.service_portal``
settings (``base_url`` and ``token``).  :doc:`management/license_management`
describes the UI workflow; this section links it to the backend REST client and the
``LicenseModule`` interface it implements.
