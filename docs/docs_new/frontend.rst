##################
Frontend & Usage
##################

.. contents::
   :local:

Bootstrapping the SPA
=====================
``src/frontend/src/index.jsx`` loads fonts/styles, initializes i18next, and
renders ``App`` into ``#root``.  ``App.tsx`` fetches ``/settings.json`` before
choosing API/socket endpoints, applies the currently selected theme, and routes
via ``BrowserRouter``.  When Service Portal access is available it also
synchronizes themes (``bindWithServicePortalThemes``).

State Management
================
``application/utils/store.ts`` combines Redux Toolkit slices (auth, application,
connection checks) with every entity reducer exported from ``@entity/index``.
Middlewares include:

- **Auth/application/notification** middlewares that intercept actions for token
  refresh or toast notifications.
- **redux-state-sync** so multiple tabs share authentication state.
- **redux-logger** when ``process.env.isDevelopment`` is set.

The store exports ``useAppDispatch`` and ``useAppSelector`` hooks that every
component uses.  ``CommonState`` centralizes the default message/error shape.

API Client Pattern
==================
``application/requests/classes/Request.ts`` defines the Axios helper used across
entities:

- Builds URLs from ``Urls.baseUrl`` / ``Urls.baseUrlApi`` set during bootstrap.
- Honors ``isFormData`` and ``hasAuthToken`` flags to adjust headers.
- Injects JWT tokens from ``LocalStorage`` if the session is still valid
  (``lastLogin``/``expTime``/``sessionTime`` check).

Entity-specific request classes extend this helper.  For example,
``entities/connection/requests/classes/Connection.ts`` maps React models to the
backend DTOs before calling ``/connection`` endpoints.  The older usage manuals
(``docs_new/usage/*.rst``) remain the authoritative UI references for connectors,
connections, and schedules, and this section links them to the underlying APIs.

Usage Highlights
================
- **Logging in** – see ``docs_new/usage/login.rst`` for screenshots.  Behind the
  scenes the login form posts to ``/login``, receives a JWT, and the frontend
  stores it via ``LocalStorage`` for header injection.
- **Connectors** – ``docs_new/usage/connectors.rst`` describes the two-step wizard.
  The React components serialize invoker metadata exactly as expected by
  ``ConnectorResource`` and expose inline editing plus testing.
- **Connections** – ``docs_new/usage/connections.rst`` shows the drag-and-drop method
  builder.  Every change dispatches Redux actions that eventually call PATCH
  endpoints so only modified methods/operators are saved.
- **Schedules** – ``docs_new/usage/schedules.rst`` covers cron generation, webhook
  creation, and the notification modal.  When the log panel is open the frontend
  subscribes to the STOMP destination provided by the backend.
- **Administration** – ``docs_new/management`` sections (authentication, license,
  template, aggregator, invoker) map to entity folders under
  ``src/frontend/src/entities``.  Each feature uses the shared request helper, so
  custom components can follow the same pattern.

Real-time Logs & Notifications
==============================
``application/classes/socket/Socket.ts`` wraps SockJS/STOMP.  It connects to
``${Urls.baseUrl}websocket`` with the user's JWT token and exposes subscribe/
unsubscribe helpers (``ConnectionLogs`` listener).  The UI toggles the log panel
from the connection designer or the scheduler grid; when open the backend only
streams the scheduler specified during the handshake.

Localization & Theming
======================
- i18next loads translations from ``locales`` and falls back to English.  Admins
  can enable theme synchronization through the Service Portal (profile toggle).
- Styled-components theme definitions live in ``@style/Theme`` and ``Global``
  applies CSS resets.  Users choose or sync themes via the admin UI.
