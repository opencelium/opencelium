##################
Extensibility
##################

.. contents::
   :local:

Invoker Authoring
=================
:doc:`../management/invoker` explains how admins can upload invokers via the
UI.  The backend mirrors the same options:

- Drop XML files into ``src/backend/src/main/resources/invoker`` and restart the
  service to pick them up.  ``InvokerParserImp`` parses the ``<requiredData>``,
  ``<operations>``, and ``<pagination>`` blocks into Java objects.
- Use the UI wizard to define authentication (API key, token, basic, endpoint),
  a test method, and one or more production operations.  The wizard writes the
  same XML structure, so both approaches stay consistent.
- When invoker files are edited manually, dependent connectors are **not**
  refreshed automatically. Synchronise them explicitly — see
  :ref:`management-smart_sync`.

Templates & Reuse
=================
:doc:`../management/template` describes the reusable **workflow templates**:

- ``Template`` entities (``template/entity/Template.java``) store metadata plus a
  serialized record containing the workflow's steps and field bindings.
- Templates are saved from, and loaded into, the workflow editor
  (**Save as Template** / **Load Template** in the header menu). The *Expert* /
  *Template* mode step of the old connection wizard no longer exists.
- Since 5.0 each method in a template also carries
  ``methods[i].connector.invoker``. That invoker name is what lets a template be
  applied in an environment with different connector IDs: the
  *Map template connectors* dialog resolves each one against the local
  connectors.
- ``Template50Updater`` converts older templates to the current layout on the
  read path, in memory, so they stay usable without a data migration.

Enhancements & Aggregators
==========================
Enhancements sit between source and target fields (``EnhancementDTO``).  They:

- Execute JavaScript via Nashorn in the core, or Python 2/Python 3/Ruby through
  the external ``polyglot-engine`` service (see :doc:`../usage/workflows`).
- Receive ``VAR_[i]`` inputs for each referenced field and must assign the output
  to ``RESULT_VAR``.
- Automatically detect missing references, replacing them with
  ``OC_VAR_NOT_EXIST``.

A field that holds a reference **without** an enhancement is a *direct
reference* — a one-to-one mapping with no script in between, which executes
faster. The UI shows this explicitly and offers to seed a script if you want one.

Aggregators (:doc:`../management/aggregator`) collect data across method
executions so notification templates can summarize results.

- Create aggregators from **Configurations → Data Aggregator** or directly from a
  workflow step's *Configure Aggregator* dialog.
- Define arguments that become placeholders inside notification templates.
- Toggle archiving to hide obsolete scripts without deleting history.

Operator Expressions (OCEL)
===========================
``If`` and ``Loop`` operators carry an expression that is evaluated by the OCEL
processor in ``backend/ocel``:

- ``ExpressionProcessor`` / ``Evaluator`` / ``ShallowEvaluator`` evaluate,
  ``Validator`` validates before execution.
- ``operator/OperatorEnum`` holds the comparison operators exposed in the
  condition builder, ``function/FunctionEnum`` the built-in functions
  (``CurrentDate``, ``CurrentDateTime``, ``CurrentTimeMills``, ``DateParse``).
- Errors surface as ``InvalidExpressionException``, ``ApplyOperatorException``,
  ``ApplyFunctionException`` and ``ValueParseException``, with codes in
  ``ocel/exception/ErrorCode``.

An operator saved without an expression is rejected with
``OPERATOR_EXPRESSION_IS_EMPTY``; the UI highlights the offending node.

Notification Templates & Events
===============================
The admin UI supports email, Slack, and Teams templates
(:doc:`../management/notification_template`).  Templates can reference
``{CONNECTION_ID}``, ``{SCHEDULER_TITLE}``, etc., or aggregator arguments.

The channel payloads are file-based and can be adapted:
``src/backend/src/main/resources/notification/{default,slack,teams}.json``, with
``${subject}`` and ``${text}`` substituted at send time.

Scheduler notifications (see :doc:`operations`) then wire templates to events:

- **Pre** – before a schedule fires, useful for change windows.
- **Post** – after a successful execution, optionally enriched by aggregators.
- **Alert** – after failures, often delivered via webhook to monitoring systems.

Custom Modules
==============
5.0 generates most screens from **entity definitions**, so adding a module means
declaring one rather than writing pages.

1. Create a folder under ``src/frontend/src/entities`` with the entity
   definition, its ``api``, ``i18n`` (``en.json``/``de.json``) and any command
   ``resolvers``, mirroring an existing entity.
2. Register it in ``engine/entity/entityRegistration.ts``. The engine then
   derives the routes (``app/router/buildEntityRoutes.tsx``), the list
   (``GenericEntityList``), the create/update/view wizards and the
   command-palette commands (``list``, ``view``, ``create``, ``update``,
   ``delete``, each optionally ``by <field>``).
3. Use the shared request layer in ``shared/api`` (``baseApi``/``baseQuery`` for
   RTK Query, ``apiExecutor``/``apiFetch`` for imperative calls). This guarantees
   JWT propagation, consistent error reporting and the automatic logout on
   ``401``/``403``.
4. Gate the module with a ``PermissionComponent`` if it needs one, so its menu
   entry and actions follow the group permissions.
