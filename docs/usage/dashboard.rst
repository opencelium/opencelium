##################
Dashboard
##################

The dashboard is now the first screen you see after signing in.  It
surfaces subscription health, current schedules, monitoring widgets and a
graph of active connectors, and each user can curate the layout.

.. contents::
   :local:

Widgets & Layout
================
- **Subscription Overview** – shows the active license, usage counters,
  and expiry dates.  It reuses the same component as the License
  Management detail view and honors free/paid subscription states.
- **Monitoring** – embeds a Netdata ``oc-mode.html`` page.  By default it
  calls ``https://<host>:19999/oc-mode.html`` and only renders if the
  endpoint responds with HTTP 200.  You can swap the URL by adding
  ``dashboard.settings.url`` to the user profile (see :ref:`usage-my_profile`).
  The Netdata template we ship lives at
  ``docs_new/files/oc-mode.html``—deploy it next to your Netdata
  dashboard to mirror the example layout.
- **Current Scheduler** – read-only table of schedules with the same
  filters as the Scheduler page.  It helps operators see failing jobs
  without leaving the dashboard.
- **Connection Overview** – renders the connectors currently used by any
  connection and links them to the central OpenCelium node.  Hovering a
  node reveals the invoker description, so this doubles as a topology map.

Click the pencil icon in the header to unlock drag-and-drop editing.
While editing, drag widgets to new coordinates or remove them with the
``x`` icon; the toolbox on the left keeps removed widgets so you can add
them back later.  Widget settings are stored per user via the backend
``/widget`` and ``/widget_setting`` endpoints, so the layout persists
across browsers.

License Alerts
==============
If OpenCelium is running without a license, or if the current license
exhausts its API operation quota, a red alert banner appears above the
widgets.  Clicking the link forwards you to the License Management page.
These alerts are powered by the same subscription service that drives
the dashboard widget, and they refresh automatically in the background.

Netdata Dependency
==================
The monitoring card uses the front-end ``requestRemoteApi`` helper to
fetch ``oc-mode.html`` from the Netdata server.  Ensure Netdata is
listening on ``:19999`` or adjust ``dashboard.settings.url`` in the user
profile to point to your monitoring stack.  If the HTTP status is not
200, the widget falls back to a “Feature not installed” text so the
failure is visible but non-blocking.

Related Pages
=============
- :doc:`application_management` – explains the notification panel,
  layout behavior, and other shared UI concepts.
- :doc:`admin` – lists the administrative cards that complement the
  dashboard widgets (e.g., License Management, Update Assistant).
