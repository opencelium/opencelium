##################
Operations
##################

.. contents::
   :local:

Schedulers & Webhooks
======================
:doc:`../usage/schedules` walks through the UI.  The following table maps those
controls to backend features:

======================  ===============================================
UI Concept              Backend Mapping
======================  ===============================================
Cron expression         Stored inside ``Scheduler.cronExp`` and validated
                        via the cron generator widget.  Editable inline from
                        the list.
Debug/logs toggle       Enables WebSocket streaming for that schedule only;
                        messages are produced by ``ExecutionObjectServiceImp``.
Webhook action          Creates a signed webhook that calls the schedule
                        endpoint with JWT validation.  Copy the URL with the
                        clipboard icon.  The same webhook is what a workflow's
                        *Trigger Workflow* step calls.
Notifications action    Persists ``EventNotification`` rows tied to templates
                        and renders them in the dialog; can be applied to
                        several selected schedules at once.
Immediate start         Calls the backend to enqueue a Quartz job instantly.
                        Refused with ``CONCURRENT_TEST_IS_FORBIDDEN`` when
                        another schedule of the same workflow is running.
Executions sub-rows     Live per-execution progress, driven by the same
                        WebSocket channel.
Support logs action     Produces a masked diagnostic bundle; the "file ready"
                        message arrives over the WebSocket.
======================  ===============================================

Notifications
=============
- Configure templates and aggregators first (see :doc:`extensibility`).
- From the scheduler grid, select one or more jobs and click the notification
  button to assign **pre**, **post**, or **alert** events.
- Email notifications prompt for recipients; webhook notifications prompt for a
  URL; aggregators become placeholders inside the template body.

License Management
==================
:doc:`../management/license_management` covers the UI in-depth.  Operational
notes:

- Free installations default to 10,000 API calls per month.  Upgrading from
  3.x→4.x requires activating a license.
- ``ServicePortal`` uses ``opencelium.service_portal`` configuration for online
  activation.  Ensure ``base_url`` and ``token`` are set, otherwise the "Activate
  License" button is disabled.
- Offline activation still uses the Activation Request file generated from the
  UI; upload it to the Service Portal, download the license, and import it.
- ``License Management`` → "Detail View" helps correlate excessive usage with
  specific workflows because each execution logs API call counts.

Updates
=======
The update playbooks in :doc:`../gettinginvolved/updating` remain the reference.
This guide highlights the most common paths:

- **Zip installations** – use the GUI Update Assistant (admin menu →
  License & System → Update Assistant) to download/apply packages.
- **Debian** – ``apt install --only-upgrade -y opencelium``.
- **SLES** – ``zypper refresh && zypper update -y OpenCelium``.
- **RHEL** – ``yum update && yum update -y OpenCelium``.
- **4.x → 5.0** – back up first, then move the LDAP block from
  ``spring.data.ldap`` to ``spring.security.ldap`` and port any customised
  frontend endpoints from ``settings.json`` to ``config.json``. Workflow
  documents are converted on read, in memory, and are only rewritten when a
  workflow is saved in 5.0.
- **Major upgrades (3.x → 4.x)** – stop services, back up ``/opt/opencelium``
  folders, install MongoDB, unpack the 4.x zip, recreate the ``opencelium``
  database user, and redeploy nginx/opencelium services. The Neo4j→MongoDB
  migration tool must be run while still on the 4.x line; it was removed in 5.0.

Observability & Troubleshooting
===============================
- ``journalctl -xe -u opencelium -f`` – tails backend logs, including LDAP/TOTP
  troubleshooting messages.
- ``src/main/resources/logs`` – stores file-based logs if ``logging.file`` is
  configured.
- Enable ``opencelium.debug_mode`` in ``application.yml`` to show more verbose
  traces in the UI and logger.
- **System Check** (admin menu → License & System) reports the status of
  OpenCelium itself, MariaDB, MongoDB, the mail server, the polyglot engine and
  the operating system, with a per-component error message.
- The **dashboard** socket dot shows whether live data is arriving; *Connection
  lost — data may be stale* usually means ``/ws`` is not proxied correctly.
- Test runs leave temporary connections behind if they are interrupted. The
  ``opencelium.sweeper.test-connection`` job removes them; ``DELETE
  /connection/test`` does it immediately.
- Frontend errors surface as toasts with the backend error code, and individual
  cards/panels fall back inside their own error boundary instead of blanking the
  page. Use the browser console for stack traces during development builds.
