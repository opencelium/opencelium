##################
Operations
##################

.. contents::
   :local:

Schedulers & Webhooks
======================
``docs_new/usage/schedules.rst`` already walks through the UI.  The following table
maps those controls to backend features:

======================  ===============================================
UI Concept              Backend Mapping
======================  ===============================================
Cron expression         Stored inside ``Scheduler.cronExp`` and validated
                        via the cron generator widget.
Logs toggle             Enables WebSocket streaming for that schedule only;
                        messages are produced by ``ExecutionObjectServiceImp``.
Webhook button          Creates a signed webhook that calls the schedule
                        endpoint with JWT validation.  Copy the URL with the
                        clipboard icon.
Notification bell       Persists ``EventNotification`` rows tied to templates
                        and renders them in the modal.
Immediate start         Calls the backend to enqueue a Quartz job instantly.
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
``docs_new/management/license_management.rst`` covers the UI in-depth.  Operational
notes:

- Free installations default to 10,000 API calls per month.  Upgrading from
  3.x→4.x requires activating a license.
- ``ServicePortal`` uses ``opencelium.service_portal`` configuration for online
  activation.  Ensure ``base_url`` and ``token`` are set, otherwise the "Activate
  License" button is disabled.
- Offline activation still uses the Activation Request file generated from the
  UI; upload it to the Service Portal, download the license, and import it.
- ``License Management`` → "Detail View" helps correlate excessive usage with
  specific connections because each execution logs API call counts.

Updates
=======
The update playbooks in ``docs_new/getting_started/updating.rst`` remain accurate.
This guide highlights the most common workflows:

- **Zip installations (4.x)** – use the GUI Update Assistant (Admin Panel →
  Update Assistant) to download/apply packages.
- **Debian** – ``apt install --only-upgrade -y opencelium``.
- **SLES** – ``zypper refresh && zypper update -y OpenCelium``.
- **RHEL** – ``yum update && yum update -y OpenCelium``.
- **Major upgrades (3.x → 4.x)** – stop services, back up ``/opt/opencelium``
  folders, install MongoDB, unpack the 4.x zip, recreate the ``opencelium``
  database user, and redeploy nginx/opencelium services.

Observability & Troubleshooting
===============================
- ``journalctl -xe -u opencelium -f`` – tails backend logs, including LDAP/TOTP
  troubleshooting messages.
- ``src/main/resources/logs`` – stores file-based logs if ``logging.file`` is
  configured.
- Enable ``opencelium.debug_mode`` in ``application.yml`` to show more verbose
  traces in the UI and logger.
- Frontend warnings typically originate from Redux middleware.  Use the browser
  console or enable ``redux-logger`` (set ``process.env.isDevelopment``) for more
  context during development builds.
