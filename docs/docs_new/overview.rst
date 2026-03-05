##################
Platform Overview
##################

.. contents::
   :local:

About OpenCelium
================
The original introduction (``docs_new/getting_started/introduction.rst``) describes OpenCelium as a
smart integration platform that lets administrators connect APIs, move data, and
control the flow through a browser.  Under the hood the application exposes a
Spring Boot backend and a React/Redux single-page frontend that orchestrate
connectors, mappings, schedulers, and notifications.

Key Capabilities
================
- **Connector catalog** – each connector wraps the connectivity rules extracted
  from invoker XML definitions (see :doc:`extensibility`).  The usage guide in
  ``docs_new/usage/connectors.rst`` still applies for UI details.
- **Connection designer** – visual editor for mapping requests/responses between
  connectors, including operators, aggregators, and enhancements (see
  ``docs_new/usage/connections.rst``).
- **Scheduler & automation** – cron-based executions, live logs via WebSockets,
  and event notifications (:doc:`operations`).
- **Administration suite** – license control, notification templates, LDAP/TOTP
  authentication, and invoker management (``docs_new/management``).
- **Service Portal integration** – optional online sync for licenses and brand
  assets when the ``service_portal`` block in ``application.yml`` is configured.

Component Landscape
===================
The following simplified diagram links the primary components that appear in the
source tree:

.. code-block:: text

   +----------------+       +----------------------+        +------------------+
   | React SPA      |<----->| Spring Boot REST API |<----+  | MariaDB (SQL)    |
   | (src/frontend) |  WS   | (src/backend)        |     |  |  - users,        |
   |                |  HTTP |                      |     |  |    connectors,   |
   +----------------+       +----------------------+     |  |    schedules     |
           ^                          ^                   |  +------------------+
           |                          |                   |
           |                          |                   v
   +----------------+       +----------------------+   +--------------------+
   | settings.json  |       | Liquibase/YAML setup |   | MongoDB            |
   | window.config  |       | Invoker XML parser   |   |  - connection graph|
   +----------------+       +----------------------+   +--------------------+

Workflow Building Blocks
========================
The platform revolves around the following entities:

1. **Invokers** define requests/responses for a remote API.  They are stored as
   XML files (``src/backend/src/main/resources/invoker``) or created through the
   admin UI (``docs_new/management/invoker.rst``).
2. **Connectors** wrap invokers, store credentials, and expose a REST resource at
   ``/connector`` (``ConnectorController``).  The UI process is covered in
   ``docs_new/usage/connectors.rst``.
3. **Connections** pair two connectors, define ordered methods/operators, and
   optionally include enhancements or aggregators (``ConnectionController``).
4. **Schedulers** trigger a connection via cron or webhook, log output over
   WebSockets, and can notify via email/webhook templates (``docs_new/usage/schedules.rst``).

Documentation Map
=================
- :doc:`deployment` – merges the requirement & installation steps from
  ``docs_new/getting_started`` with current code expectations.
- :doc:`configuration` – expands ``application_default.yml`` and frontend
  runtime knobs.
- :doc:`architecture` – tours backend packages and data stores with references to
  the Java source.
- :doc:`frontend` – summarizes SPA behavior and cross-links to the usage
  manuals for task-oriented guides.
- :doc:`extensibility` – explains invokers, templates, aggregators, and
  enhancements, combining the admin docs with the implementation.
- :doc:`operations` – consolidates scheduler, notification, license, and logging
  practices from ``docs_new/usage`` and ``docs_new/management`` plus new runtime notes.
