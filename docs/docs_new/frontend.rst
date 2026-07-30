##################
Frontend & Usage
##################

.. contents::
   :local:

.. note::
   The frontend was rebuilt from scratch in 5.0. This chapter describes the new
   structure; the task-oriented guides live in :doc:`../usage/index`.

Build & Bootstrapping
=====================
The SPA is built with **Vite** (``vite.config.ts``), not Webpack. Relevant
scripts in ``src/frontend/package.json``:

- ``npm run dev`` – dev server on port 5173,
- ``npm run build`` – ``vite build`` followed by
  ``scripts/write-production-config.cjs``,
- ``npm run test`` / ``test:watch`` – Vitest,
- ``npm run typecheck`` – ``tsc --noEmit``.

``src/main.tsx`` is the entry point. Before anything renders it:

1. registers the entity definitions (``engine/entity/entityRegistration.ts``),
2. initialises the per-entity i18n resources,
3. ``await loadRuntimeConfig()`` – fetches ``/config.json`` and resolves
   ``runtimeConfig.apiUrl`` / ``socketUrl``. Every request and socket call reads
   ``runtimeConfig`` at call time, so this must complete before the first
   request is fired,
4. in development, starts the MSW mock worker unless
   ``VITE_ENABLE_MOCKS=false``.

It then renders ``App`` (``app/index.tsx``) inside a ``ReactFlowProvider``.
``App`` is only ``AppProviders`` wrapping ``AppRouter``.

.. note::
   ``config.json`` replaces the ``settings.json`` of earlier versions and holds
   ``server`` and ``socket`` blocks with ``protocol``/``hostname``/``port``/
   ``prefix``. The production build overwrites ``dist/config.json`` with the
   reverse-proxy defaults (``/api`` and ``/ws``). See
   :ref:`getting_started-administration-app_config`.

Source layout
=============
The code follows a feature-sliced structure:

.. list-table::
   :header-rows: 1
   :widths: 20 80

   * - Layer
     - Content
   * - ``app``
     - Providers, layouts (``AppLayout``, ``PublicLayout``), router, store,
       global hooks.
   * - ``engine``
     - The generic machinery: ``entity`` (entity registry, generic
       lists/wizards, command generation) and ``policy`` (permission
       resolution).
   * - ``entities``
     - One folder per domain object (``connection``, ``connector``,
       ``connectionTemplate``, ``schedule``, ``user``, ``role``, ``invoker``,
       ``category``, ``dataAggregator``, ``notificationTemplate``,
       ``supportFile``, ``systemCheck``, ``systemConfig``, ``ldap``,
       ``subscription``, ``updateAssistant``, ``ui``, ``meta``, ``auth``), each
       with its definition, API, i18n and command resolvers.
   * - ``features``
     - Cross-cutting behaviour: ``workflow`` (the editor), ``auth``, ``logs``,
       ``master-password``, ``notifications``, ``sandbox``, ``user``.
   * - ``pages``
     - Thin route components.
   * - ``widgets``
     - Composite UI: ``CommandPalette``, ``TopBar``, ``ProfileDialog``,
       ``SubscriptionAlert``, ``SystemMetrics``.
   * - ``shared``
     - ``api``, ``command``, ``config``, ``errors``, ``form``, ``i18n``,
       ``lib``, ``table``, ``theme``, ``ui``, ``testing``, ``utils``.

Entity registry
===============
Most screens are generated rather than hand-written. An entity definition
declares its API, fields, list columns, wizard steps and routes; the engine
derives from it:

- the routes (``app/router/buildEntityRoutes.tsx``),
- the list (``GenericEntityList``) and the create/update/view wizards,
- the command-palette commands
  (``engine/entity/command/createEntityCommands.tsx``: ``list``, ``view``,
  ``create``, ``update``, ``delete``, each optionally ``by <field>``).

Adding an entity therefore means adding a definition plus its i18n, not writing
a new page.

State & API client
==================
- **Redux Toolkit** (``app/store``) holds the application state.
- ``shared/api`` provides the request layer: ``baseApi``/``baseQuery`` for RTK
  Query, ``apiExecutor``/``apiFetch`` for imperative calls, ``executeRemote``
  for step actions such as a connector test, ``decodeJwt`` and
  ``handleApiError``.
- Forms use **react-hook-form** with **zod** resolvers (``shared/form``).
- Tables are built on **@tanstack/react-table** (``shared/table``), which is
  where sub-rows, full-width rows and percentage column widths are implemented.

UI kits
=======
The UI is kit-aware: primitives in ``shared/ui/primitives`` are registered in a
dynamic facade and resolve to **Ant Design** or **MUI** implementations. This is
why dialogs, selects and tables behave identically wherever they appear, and why
new primitives (for example ``Empty`` and ``Splitter``) have to be registered
before use.

Workflow editor
===============
``features/workflow`` is the largest feature. It is built on
**@xyflow/react** (React Flow):

- ``nodes/`` – ``StartNode``, ``ConnectorMethodNode``, ``SystemMethodNode``,
  ``TriggerConnectionNode``, ``IfOperatorNode``, ``LoopOperatorNode``, plus
  badges and shells,
- ``edges/WorkflowEdge`` – the connections between steps,
- ``components/`` – header, sidebar, canvas, logs, request editor,
  condition builder, aggregator dialog, template dialogs, schedules drawer,
- ``api/connectionPayload.ts`` – maps the graph to the ``/connection`` payload
  and back. All steps are written into a single ``fromConnector`` container with
  ``connectorId: -1``; ``toConnector`` is ``null`` and every method carries its
  own ``connector`` plus ``methodType``
  (``CONNECTOR`` / ``HTTP_REQUEST`` / ``WEBHOOK``),
- ``test-run/`` – test-run state, persisted so a run survives a reload, with a
  leave guard,
- ``command/`` – the palette bridge and the Fuse.js workflow search.

Real-time logs & metrics
========================
``shared/api/socket`` wraps SockJS/STOMP: ``socketClient``,
``SocketTransportProvider``, ``useSocket`` and ``useStompSubscription``. The
endpoint comes from ``runtimeConfig.socketUrl`` (``/ws`` by default).

Consumers are the workflow test run (``features/workflow/test-run``), the live
dashboard metrics (``widgets/SystemMetrics``) and the support-file ready
notification.

Error handling
==============
- ``shared/errors/boundary`` provides scoped, recoverable error boundaries;
  dashboard cards are isolated individually.
- ``401``/``403`` responses trigger an automatic logout, close globally hosted
  dialogs and remember the route for the next login.
- An error bus carries per-error toast lifetimes, so specific backend codes
  (``CONNECTOR_NOT_FOUND``, ``OPERATOR_EXPRESSION_IS_EMPTY``,
  ``CONCURRENT_TEST_IS_FORBIDDEN``, ``INVALID_TOKEN``) are surfaced with their
  own message.

Localization & theming
======================
- i18next loads shared namespaces from ``shared/i18n/locales/{en,de}`` and
  per-entity resources from ``entities/*/i18n``. English and German are complete;
  the language is toggled in the top bar.
- Themes live in ``shared/theme`` and are applied per user. Light and dark are
  supported throughout, including canvas, dialogs and the log viewer.

Testing
=======
- **Vitest** with ``vitest.config.ts``; helpers in ``shared/testing``.
- **MSW** mocks in ``src/mock`` back the dev server and the tests.
- Interactive primitives accept a ``testId``, and forms/lists/wizards derive
  entity-prefixed ``data-testid`` values through ``TestScopeContext`` for
  Selenium end-to-end tests.
