.. _operations-requirements:

############
Requirements
############

These requirements apply to OpenCelium **5.3**. For a production installation we
recommend the setup below; the *minimum* column is what 5.3 needs to run at all.

.. contents::
   :local:

Hardware
========

A virtual machine with:

- 2 vCPUs
- 8 GB RAM
- 50 GB disk space

Add CPU and memory if many workflows run at the same time or handle large
payloads — uploads of templates and API definitions can be up to 1 GB.

Software
========

.. list-table::
   :header-rows: 1
   :widths: 18 24 26 32

   * - Component
     - Minimum
     - Recommended
     - Notes
   * - Java
     - 17 (JRE)
     - 17 LTS (OpenJDK / Temurin)
     - The backend is built for Java 17. Newer Java versions are **not yet
       validated** for 5.3 — see :ref:`requirements-java`.
   * - MariaDB
     - 10.11 LTS
     - 11.8 LTS
     - 11.4 LTS works as well. From 10.10 on, the 5.3 tables use the
       ``utf8mb4_uca1400_ai_ci`` collation; older servers keep
       ``utf8mb4_general_ci``. MariaDB 11.6 and later are handled (the backend
       uses ``READ COMMITTED`` instead of the new snapshot isolation).
   * - MongoDB
     - 6.0
     - 8.0 or later
     - 5.3 is in use with MongoDB 8.2.
   * - nginx
     - any version that proxies WebSockets
     - current stable, or the package of your distribution
     - Apache works too (``conf/apache-oc_default.conf``). See
       :ref:`requirements-proxy`.
   * - Node.js
     - 20.19 or 22.12
     - 22 LTS
     - **Only needed to build the frontend yourself.** The packages and the ZIP
       already contain the built frontend.

Download links:
`nginx <https://nginx.org/en/download.html>`_ ·
`MongoDB <https://www.mongodb.com/docs/manual/administration/install-on-linux/>`_ ·
`OpenJDK 17 (Temurin) <https://adoptium.net/temurin/releases/?version=17>`_ ·
`MariaDB <https://mariadb.com/kb/en/mariadb-server-release-dates/>`_

.. versionchanged:: 5.3
   The table separates minimum and recommended versions. MongoDB 8 and
   MariaDB 11.8 LTS are recommended; Java stays at 17.

.. _requirements-java:

Java
----

OpenCelium 5.3 is compiled for Java 17 and is built on Spring Boot 3.0, which
officially supports Java 17 to 19. Run it on a **Java 17** runtime.

Java 21 and 25 are not yet validated for 5.3. Until they are, use Java 17 even on
distributions whose default Java is newer — install the ``java-17``/``openjdk-17``
package next to it, or a Temurin 17 build, and point ``JAVA_BIN`` in
``scripts/oc_service.sh`` (or ``ExecStart`` in the systemd unit) at it.

Operating system
================

Installation guides and packages exist for:

- Ubuntu 24.04 LTS "Noble Numbat" (DEB package and ZIP)
- Debian GNU/Linux 12 "Bookworm" (ZIP)
- SUSE Linux Enterprise Server 15 SP5 or later SP (RPM package and ZIP)
- Red Hat Enterprise Linux 9 (ZIP)
- Docker (any host with Docker Engine and Compose v2)

Newer releases — Debian 13, Ubuntu 26.04, RHEL 10, SLES 16 — are not listed yet.
Several of them no longer ship a Java 17 package by default; check that you can
install Java 17 there before you use them (see :ref:`requirements-java`).

Network
=======

- Frontend: open port 80, or 443 with SSL.
- Backend: port 9090 — only needs to be reachable from the reverse proxy unless
  clients call the REST API directly.
- Outbound: the target systems of your connectors. With
  ``opencelium.online-services.active`` (default ``true``) also the OpenCelium
  Service Portal and GitHub, for license, API definition sync and the online
  repository — see :doc:`../reference/configuration`.

.. _requirements-proxy:

Reverse proxy
-------------

- **WebSockets.** The test run, the live dashboard, the support-log
  notifications and the running schedules use the WebSocket channel under
  ``/ws`` on the backend port. A reverse proxy must forward ``/ws`` with the
  ``Upgrade`` and ``Connection`` headers; the shipped ``conf/nginx_default.conf``
  already does this.
- **Upload size.** 5.3 accepts uploads of templates and API definitions up to
  1 GB, but the shipped nginx configuration limits request bodies to
  ``client_max_body_size 200M``. Raise it if you upload larger files, otherwise
  nginx answers ``413``.

Browser
=======

A current version of Chrome, Edge, Firefox or Safari. The frontend is an
ES-module build and does not support Internet Explorer. The schedule calendar
shows times in the server's time zone when ``serverTimeZone`` is set in the
frontend's ``config.json`` — see :doc:`../reference/configuration`.
