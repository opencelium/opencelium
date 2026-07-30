##################
Platform Overview
##################

.. contents::
   :local:

About OpenCelium
================
OpenCelium is a smart integration platform that lets administrators connect APIs,
move data, and control the flow through a browser.  Under the hood the
application exposes a Spring Boot backend and a React single-page frontend that
orchestrate connectors, mappings, schedulers, and notifications.

Key Capabilities
================
- **Connector catalog** – each connector wraps the connectivity rules extracted
  from invoker XML definitions (see :doc:`extensibility`).  The usage guide in
  :doc:`../usage/connectors` covers the UI details.
- **Workflow editor** – a graph editor for a freely branching sequence of steps
  across any number of connectors, including operators, aggregators, references
  and enhancements (see :doc:`../usage/workflows`).
- **Command interface** – a global command palette (``Ctrl+K``) that searches and
  executes across the platform (see :doc:`../usage/command_palette`).
- **Scheduler & automation** – cron-based executions, live logs via WebSockets,
  and event notifications (:doc:`operations`).
- **Administration suite** – license control, notification templates, LDAP/TOTP
  authentication, invoker management, system health checks and in-UI editing of
  ``application.yml`` (see :doc:`../usage/admin`).
- **Service Portal integration** – optional online sync for licenses, invokers,
  templates and brand assets when the ``service_portal`` block in
  ``application.yml`` is configured.

Component Landscape
===================
The following simplified diagram links the primary components that appear in the
source tree:

.. code-block:: text

   +----------------+       +----------------------+        +------------------+
   | React SPA      |<----->| Spring Boot REST API |<----+  | MariaDB (SQL)    |
   | (src/frontend) |  /ws  | (src/backend)        |     |  |  - users,        |
   |   Vite build   |  /api |                      |     |  |    connectors,   |
   +----------------+       +----------------------+     |  |    schedules     |
           ^                          ^                   |  +------------------+
           |                          |                   |
           |                          |                   v
   +----------------+       +----------------------+   +--------------------+
   | config.json    |       | Liquibase/YAML setup |   | MongoDB            |
   | (runtime)      |       | Invoker XML parser   |   |  - workflow graph  |
   +----------------+       +----------------------+   +--------------------+

Workflow Building Blocks
========================
The platform revolves around the following entities:

1. **Invokers** define requests/responses for a remote API.  They are stored as
   XML files (``src/backend/src/main/resources/invoker``) or created through the
   admin UI (:doc:`../management/invoker`).
2. **Connectors** wrap invokers, store credentials, and expose a REST resource at
   ``/connector`` (``ConnectorController``).  The UI process is covered in
   :doc:`../usage/connectors`.
3. **Workflows** are a freely branching sequence of steps. Each step carries its
   own connector and a method type (a connector method, a plain HTTP request, or a
   webhook that triggers another workflow), plus optional enhancements and
   aggregators (``ConnectionController``).

   .. note::
      Workflows were called *Connections* before 5.0 and were limited to a
      *from* and a *to* connector. The REST API and the Java packages keep the
      old name; see :ref:`usage-workflow-model`.

4. **Schedulers** trigger a workflow via cron or webhook, log output over
   WebSockets, and can notify via email/webhook templates
   (:doc:`../usage/schedules`).

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
