##################
Extensibility
##################

.. contents::
   :local:

Invoker Authoring
=================
``docs_new/management/invoker.rst`` explains how admins can upload invokers via the
UI.  The backend mirrors the same options:

- Drop XML files into ``src/backend/src/main/resources/invoker`` and restart the
  service to pick them up.  ``InvokerParserImp`` parses the ``<requiredData>``,
  ``<operations>``, and ``<pagination>`` blocks into Java objects.
- Use the UI wizard to define authentication (API key, token, basic, endpoint),
  a test method, and one or more production operations.  The wizard writes the
  same XML structure, so both approaches stay consistent.
- When invoker files are edited manually, use the **Synchronize invokers** action
  in the connection designer (see ``docs_new/usage/connections.rst``) to refresh
  dependent connectors.

Templates & Reuse
=================
``docs_new/management/template.rst`` and the ``Mode`` step of the connection wizard
let you build reusable templates:

- ``Template`` entities (``template/entity/Template.java``) store metadata plus
  a serialized ``CtionTemplateResource`` record containing connectors and field
  bindings.
- Users can load templates at connection creation time and upgrade them when the
  backend version changes.
- The frontend exposes a "Create template from connection" shortcut that packages
  the current designer state and uploads it through the template API.

Enhancements & Aggregators
==========================
Enhancements sit between source and target fields (``EnhancementDTO``).  They:

- Execute JavaScript via Nashorn (see comments in ``docs_new/usage/connections.rst``).
- Receive ``VAR_[i]`` inputs for each referenced field and must assign the output
  to ``RESULT_VAR``.
- Automatically detect missing references, replacing them with
  ``OC_VAR_NOT_EXIST``.

Aggregators (``docs_new/management/aggregator.rst``) collect metrics across method
executions so notification templates can summarize results.

- Create aggregators from the Admin Panel or directly from the connection
  designer's Details panel.
- Define arguments that become placeholders inside notification templates.
- Toggle archiving to hide obsolete scripts without deleting history.

Notification Templates & Events
===============================
The admin UI supports email, Slack, and Teams templates
(``docs_new/management/notification_template.rst``).  Templates can reference
``{CONNECTION_ID}``, ``{SCHEDULER_TITLE}``, etc., or aggregator arguments.

Scheduler notifications (see :doc:`operations`) then wire templates to events:

- **Pre** – before a schedule fires, useful for change windows.
- **Post** – after a successful execution, optionally enriched by aggregators.
- **Alert** – after failures, often delivered via webhook to monitoring systems.

Custom Modules
==============
The ``src/frontend/src/entities`` tree is organized per domain (connector,
connection, notification_template, etc.).  To add your own module:

1. Create a folder inside ``entities`` with ``classes``, ``requests``,
   ``components``, ``translations`` mirroring the existing pattern.
2. Export reducers and middlewares via ``entities/index.tsx`` so the global store
   picks them up automatically.
3. Implement a request class that extends ``application/requests/classes/Request``
   and honors the same auth rules.  This guarantees JWT propagation, proxy
   handling, and consistent error reporting.
