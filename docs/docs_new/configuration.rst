##################
Configuration
##################

.. contents::
   :local:

Server Settings
===============
OpenCelium ships with ``application_default.yml`` (``src/backend/src/main/resources``).
Copy it to ``application.yml`` and adapt the following blocks:

- ``server`` – change the backend port (default 9090) and optionally uncomment the
  SSL section to load a PKCS#12 keystore.
- ``spring.datasource`` – point to your MariaDB instance, TLS options, and DBA
  credentials created during installation.
- ``spring.data.mongodb.uri`` – contains ``oc_admin`` credentials and hosts the
  graph database.  Only the URI string needs to change.
- ``spring.mail`` / ``spring.rabbitmq`` / ``spring.security.ldap`` – optional
  third party services.  The LDAP structure mirrors the UI instructions in
  :doc:`../management/authentication` and drives ``SecurityConfiguration``.

  .. note::
     The LDAP block moved from ``spring.data.ldap`` to ``spring.security.ldap``
     in 5.0, and its debug switch from
     ``logging.level.org.springframework.data.ldap`` to
     ``logging.level.org.springframework.security.ldap``.

- ``spring.jpa.hibernate.ddl-auto`` – note the spelling; earlier default files
  shipped a typo (``dll-auto``) that silently did nothing.
- ``spring.web.resources.add-mappings`` – a plain boolean key in 5.0
  (previously written as ``add-mappings=false:``).

Scheduling & Persistence
========================
- ``spring.quartz`` – sets the thread pool size and instructs Quartz to store job
  data in JDBC tables (``QRTZ_*``).  Adjust ``threadCount`` if many concurrent
  schedules run.
- ``spring.liquibase.change-log`` – points to ``db/changelog/changelog-master.xml``
  so Liquibase can apply schema migrations at startup.
- ``springdoc.swagger-ui`` – exposes ``/docs`` and configures supported HTTP
  verbs.  Keep it enabled for API discovery.

Logging & Management
====================
``logging.file`` and ``logging.pattern.console`` define output paths and formats.
Use the ``logging.level`` hierarchy to toggle LDAP debug output (``ldap: DEBUG``)
when diagnosing authentication.  ``management.endpoint.health`` is already tuned
so health checks return HTTP 200 even for ``DOWN`` to simplify load balancer
integration.

OpenCelium Block
================
The ``opencelium`` section collects platform-specific settings:

- ``version`` and ``debug_mode`` toggle UI hints and backend logging.
- ``token`` contains the JWT secret, session activity timeout, and expiration
  window used by ``JwtTokenUtil``.
- ``config`` (new in 5.0) tells the ``/application-config`` endpoint which file to
  read and write (``file-path``) and where to keep the pre-write backups
  (``backup.directory``, ``backup.keep``).
- ``sweeper.test-connection`` (new in 5.0) controls the background job that
  removes leftover test connections: ``enabled``, ``fixed-delay`` and
  ``initial-delay`` in milliseconds.
- ``connector.master-password`` protects connector credentials and additionally
  gates the GraphQL schema browser and the System Configuration page.
- ``notification.tools`` configures webhook URLs used when schedules trigger
  external systems.
- ``installation.type`` differentiates ``sources`` vs packaged setups (used by
  update assistant logic in ``docs_new/getting_started/updating.rst``).
- ``service_portal`` stores ``base_url`` and ``token`` for online license
  activation and theme synchronization.
- Optional ``rest_template.proxy`` values supply the proxy credentials consumed
  by ``ExecutionObjectServiceImp`` when building runtime requests.

Editing application.yml from the UI
===================================
Since 5.0 the whole file can be edited under **License & System →
Configurations**, backed by ``GET``/``PATCH /application-config``. The editor
preserves the inline comments of ``application_default.yml``, comments sections
in and out with a cascading enable/disable, masks secrets, and writes a backup
before every change. A restart is still required.
See :ref:`admin_panel-system_config`.

Frontend Runtime Configuration
==============================
The SPA is built with Vite and reads a single runtime file, ``config.json``,
served next to ``index.html``. ``src/main.tsx`` awaits ``loadRuntimeConfig()``
before rendering, so ``runtimeConfig.apiUrl`` and ``runtimeConfig.socketUrl`` are
resolved before the first request is fired.

.. code-block:: json

   {
     "server": { "protocol": "", "hostname": "", "port": "", "prefix": "/api" },
     "socket": { "protocol": "", "hostname": "", "port": "", "prefix": "/ws" }
   }

Empty ``protocol``/``hostname`` mean "same origin as the frontend". Because the
file is read at runtime, endpoints can be changed in a deployed installation
without rebuilding.

- ``public/config.json`` holds the **development** defaults (direct ``:9090``,
  no prefix).
- ``scripts/write-production-config.cjs`` runs as the last step of
  ``npm run build`` and overwrites ``dist/config.json`` with the reverse-proxy
  values (``/api``, ``/ws``) that production deployments need.

.. note::
   ``settings.json`` and ``window.config.env.urlInfo`` of earlier versions are no
   longer used.

Secrets & Certificates
======================
- Keep ``application.yml`` readable only by the ``opencelium`` service account if
  it contains LDAP/service portal tokens.
- When enabling TLS for the backend, convert your certificate and private key to
  ``.p12`` as shown in ``docs_new/getting_started/installation.rst``::

      openssl pkcs12 -export -out /opt/opencelium/src/backend/src/main/resources/opencelium.p12 \
        -in /etc/ssl/certs/opencelium.pem -inkey /etc/ssl/private/opencelium.key

- nginx SSL offload is configured in ``conf/nginx-ssl.conf``; update the
  ``ssl_certificate`` paths there as needed.
