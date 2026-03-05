##################
Deployment
##################

.. contents::
   :local:

System Requirements
===================
The recommendations from ``docs_new/getting_started/requirements.rst`` remain valid
and are summarized here for quick reference:

- **Virtual hardware** – 2 vCPUs, 8 GB RAM, 50 GB disk.
- **Operating systems** – Debian 12, Ubuntu 24.04 LTS, SLES 15 SP5, or RHEL 9.
- **Software** – nginx 1.26, MongoDB 7.0, Java 17 (JDK), MariaDB 10.
- **Network** – expose frontend 80/443, backend 9090, socket 8082 if remote log
  streaming is required.

Installation on Debian/Ubuntu
=============================
Treat this section as a deployment checklist.  Every shell command and full
walk-through remains in ``docs_new/getting_started/installation.rst`` (see the
*Debian/Ubuntu* chapter), so operations teams only have to keep the detailed
guide up to date once.

- **Prepare the host** – update the OS, install ``unzip``, MariaDB, Java 17, and
  nginx, then follow the MongoDB vendor instructions.  Enable ``mariadb`` and
  ``mongod`` services once the packages are installed.
- **Deploy the release artifact** – download the latest ``oc_latest.zip`` from
  PackageCloud, unpack it below ``/opt/opencelium``, and link the ``oc`` helper
  script into ``/usr/bin`` for easier service control.
- **Provision databases** – import ``database/oc_data.sql``, create the
  ``opencelium`` MariaDB user, and create the ``oc_admin`` MongoDB user.  Make
  sure the credentials match the ``spring.datasource`` and
  ``spring.data.mongodb.uri`` entries you will place into ``application.yml``.
- **Expose HTTP/S** – link ``conf/nginx.conf`` (or ``nginx-ssl.conf``) into
  ``/etc/nginx/sites-enabled/oc.conf`` and reload nginx so the frontend can serve
  ``/settings.json`` and proxy API calls.
- **Finalize configuration** – copy
  ``src/backend/src/main/resources/application_default.yml`` to
  ``application.yml`` and adapt secrets, SSL details, LDAP/service-portal
  settings, and proxy configuration for the target environment.
- **Register the service** – link ``conf/opencelium.service`` into
  ``/etc/systemd/system``, run ``systemctl daemon-reload``, enable the unit, and
  start OpenCelium.  At this point ``journalctl -u opencelium -f`` should show a
  clean startup log.

Installation on SLES 15 SP5
===========================
Follow the same workflow as Debian, substituting the SLES command set from
``docs_new/getting_started/installation.rst`` (``zypper`` for packages,
``insserv``/systemd for services).  The only platform-specific notes are:

- Install prerequisites with ``zypper install unzip insserv mariadb ...`` and
  use the SLES MongoDB repository when following the vendor install guide.
- When registering the service, ensure ``insserv`` creates the correct symlinks
  before calling ``systemctl enable opencelium``.
- Package names and file locations match the Debian instructions, so the
  database preparation, nginx linkage, and ``application.yml`` customization are
  identical once the packages are in place.

Post-install Checks
===================
- Access ``http://<host>`` and log in with the default credentials
  ``admin@opencelium.io`` / ``1234`` (change immediately).
- Tail backend logs via ``journalctl -xe -u opencelium -f`` when validating LDAP
  or invoker issues.
- Verify that the frontend can fetch ``/settings.json`` (served by nginx) so it
  can rewrite API/socket/Kibana URLs before bootstrapping React.
