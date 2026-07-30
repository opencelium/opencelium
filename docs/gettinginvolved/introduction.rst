##################
Introduction
##################

OpenCelium is a smart integration plattform. Connect any API's. Transfer data to every app. Enrich data from several sources. Full access via webinterface.

What is new in 5.0
""""""""""""""""""

* **Workflows instead of Connections.** An integration is no longer limited to a
  source and a target connector. A workflow is a freely branching sequence of
  steps, and every step calls the connector you choose — so complex and
  bidirectional integrations fit into one workflow.
  See :ref:`usage-workflow-model`.
* **Simple HTTP request steps.** A step does not have to come from an invoker.
  Add a plain REST call and configure URL, HTTP method, headers and body
  yourself.
* **Trigger Workflow steps.** Start another workflow's schedule through its
  webhook, without waiting for it to finish.
* **Live connector availability.** Connector nodes show a status dot while you
  build, so an unreachable system is noticed before the workflow goes into
  production.
* **A global command interface.** Press ``Ctrl+K`` anywhere to search and execute
  across the platform — open lists, create and update entities, upload and
  download templates and invokers, or search the workflow you have open.
  See :doc:`../usage/command_palette`.
* **Redesigned user interface** with a unified iconography, a two-menu
  navigation, and consistent lists and wizards throughout.
* **application.yml editable from the UI.** Change the backend configuration
  under *License & System → Configurations*, with comment preservation, masked
  secrets and automatic backups. See :ref:`admin_panel-system_config`.
* **System Check.** One page reporting the health of OpenCelium, MariaDB,
  MongoDB, the mail server, the polyglot engine and the host.
* **Dashboard with history.** Seven days of executions and failures, live CPU and
  memory, and the top workflows by execution count.
* **Password reset.** Users can request a reset link from the login page.

Updating from 4.x? Read :doc:`updating` first — two ``application.yml`` keys
moved, and the frontend endpoint configuration changed from ``settings.json`` to
``config.json``.
