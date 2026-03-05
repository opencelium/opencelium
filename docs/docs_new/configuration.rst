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
- ``spring.mail`` / ``spring.rabbitmq`` / ``spring.ldap`` – optional third party
  services.  The LDAP structure mirrors the UI instructions in
  ``docs_new/management/authentication.rst`` and drives ``SecurityConfiguration``.

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
- ``notification.tools`` configures webhook URLs used when schedules trigger
  external systems.
- ``installation.type`` differentiates ``sources`` vs packaged setups (used by
  update assistant logic in ``docs_new/getting_started/updating.rst``).
- ``service_portal`` stores ``base_url`` and ``token`` for online license
  activation and theme synchronization.
- Optional ``rest_template.proxy`` values supply the proxy credentials consumed
  by ``ExecutionObjectServiceImp`` when building runtime requests.

Frontend Runtime Configuration
==============================
The React app reads two layers of configuration before rendering:

1. ``src/frontend/src/scripts/config.js`` exposes ``window.config.env.urlInfo``
   with default ports for API (9090), socket (8082), Kibana (5601), and the
   development server.  Override this file when bundling custom appliances.
2. ``/settings.json`` (fetched by ``App.tsx`` during bootstrap) can override the
   protocol, hostname, exposed ports, and backend path prefix.  When present it
   sets ``Urls.baseUrl``, ``Urls.baseUrlApi``, ``Urls.socketServer``, and
   ``Urls.kibanaUrl`` that drive every request helper and the STOMP socket.

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
