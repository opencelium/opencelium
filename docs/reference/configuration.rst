.. _ref-configuration:

#############
Configuration
#############

.. contents::
   :local:

The backend is configured in one file:

.. code-block::

   /opt/opencelium/src/backend/src/main/resources/application.yml

If it does not exist yet, copy the documented default beside it:

.. code-block:: sh

   cp .../application_default.yml .../application.yml

Since 5.0 the same file can be edited from the UI — see
:doc:`../guides/configure-the-system`. Either way, **the backend must be
restarted** for a change to take effect.

.. _ref-config-file:

opencelium.config
=================

Where the ``/application-config`` endpoint reads and writes, and how it keeps
backups.

.. code-block:: yaml

   opencelium:
     config:
       # the application.yml on disk to read and write
       file-path: src/main/resources/application.yml
       backup:
         # pre-write backups, named <file>.bak.<epochMillis>
         directory: runtime/backup/application
         # how many recent backups to keep per target file
         keep: 10

.. _ref-config-sweeper:

opencelium.sweeper
==================

Every test run creates a temporary connection. The sweeper permanently removes
the ones left behind by interrupted runs. A test connection that is currently
running is never deleted.

.. code-block:: yaml

   opencelium:
     sweeper:
       test-connection:
         enabled: true          # default true
         fixed-delay: 900000    # ms between runs, non-overlapping
         initial-delay: 0       # ms before the first run; 0 also cleans at startup

``DELETE /connection/test`` does the same on demand.

opencelium.connector
====================

.. code-block:: yaml

   opencelium:
     connector:
       master-password: <password>

Protects connector credentials, and additionally gates browsing a connector's
GraphQL schema and the System Configuration page. ASCII characters only.

.. _ref-config-polyglot:

opencelium.polyglot
===================

The external engine that executes Python and Ruby transformations.

.. code-block:: yaml

   opencelium:
     polyglot:
       enabled: false
       protocol: grpc          # grpc (default), http (future)
       host: '127.0.0.1'
       port: 6566
       auto-start: false       # start the JAR if it is not running
       launch:
         jarPath:              # required only when auto-start is true
         args:
         waitTimeoutSec: 30
         jvmArgs: '-Xms64m -Xmx256m'
         external-log-enabled: false

.. warning::
   This block belongs **under** ``opencelium:``. The backend binds it from the
   prefix ``opencelium.polyglot``; a top-level ``polyglot:`` block is silently
   ignored, transformations keep running on the internal JavaScript engine, and
   nothing tells you why.

Reachability is reported as the **Polyglot** row on :ref:`ref-system-check`.

.. _ref-config-polyglot-service:

Deploying the engine
--------------------

The engine is a separate Spring Boot gRPC service and is **not** part of the
OpenCelium package. Build it from source:

.. code-block:: sh

   git clone https://github.com/opencelium/polyglot-engine.git
   cd polyglot-engine
   ./mvnw -B package -DskipTests

.. note::
   The resulting JAR is large (roughly 350 MB) because it bundles the GraalVM
   language runtimes for Python and Ruby.

Install it and run it as a service rather than by hand, so it survives a reboot:

.. code-block:: sh

   install -d /opt/opencelium/polyglot
   cp target/oc-polyglot-engine-*.jar /opt/opencelium/polyglot/oc-polyglot-engine.jar

``/etc/systemd/system/opencelium-polyglot.service``:

.. code-block:: ini

   [Unit]
   Description=OpenCelium Polyglot Engine
   After=syslog.target network.target
   Before=opencelium.service

   [Service]
   Type=simple
   Restart=on-failure
   RestartSec=5s
   Environment=GRPC_SERVER_PORT=6566
   WorkingDirectory=/opt/opencelium/polyglot
   ExecStart=/usr/lib/jvm/java-17-openjdk-amd64/bin/java -Xms64m -Xmx512m \
     -jar /opt/opencelium/polyglot/oc-polyglot-engine.jar
   ExecStop=/bin/kill -15 $MAINPID

   [Install]
   WantedBy=multi-user.target

.. code-block:: sh

   systemctl daemon-reload
   systemctl enable --now opencelium-polyglot

.. warning::
   Do not overwrite the JAR in place while the service is running — the JVM has
   the file mapped, and replacing it under a live process can make it fail in
   confusing ways. Stop the service, copy the new JAR, start it again.

Then set ``enabled: true`` in the block above and restart the backend. The
**Polyglot** row on :ref:`ref-system-check` turns *Operational* once the gRPC
health service answers on the configured port.

.. note::
   ``GRPC_SERVER_PORT`` in the unit and ``opencelium.polyglot.port`` in
   ``application.yml`` must match.

.. note::
   ``auto-start: true`` with ``launch.jarPath`` lets the backend start the JAR
   itself instead. A separate unit is usually preferable: the engine's lifecycle,
   logs and memory limits stay independent of the backend.

.. _ref-config-online-services:

opencelium.online-services
==========================

One switch for every feature that reaches out to the internet, plus the scheduled
synchronisation of API definitions and workflow templates from the Service Portal.

.. code-block:: yaml

   opencelium:
     online-services:
       active: true            # master switch, default true
       invoker-sync:
         time: 0 0 0 * * *
         active: false
       template-sync:
         time: 0 0 0 * * *
         active: false

**active** defaults to ``true``: a missing key, or the whole block commented out
as in the shipped ``application.yml``, means online services are **on**. Setting it
to ``false`` switches off:

* the Service Portal connection — license activation, API definition and
  template sync, the usage report,
* installing API definitions from the online repository (``install
  online-invokers`` and the onboarding tour),
* the online versions in the Update Assistant — an offline package still works,
* the Gravatar suggestion for profile pictures.

With online services off, the license page offers **Generate Activation Request**
and **Import License** (a ``.txt`` file) instead of **Activate**. Features that
are blocked say why in their tooltip — browser offline, switched off here, or the
Service Portal not reachable from the server.

.. warning::
   An installation that started on a version before 4.5.1 and was upgraded since
   carries ``active: false``: the 4.5.1 configuration migration wrote it, and it
   leaves these features off without anyone having chosen that. Check the value after upgrading if the onboarding tour's *Install from
   online repository* is disabled.

.. note::
   In 5.0 these are real booleans. Earlier versions wrote them as quoted strings
   (``"false"``); drop the quotes when carrying an old file over.

.. _ref-config-invoker-repository:

opencelium.invoker-repository
=============================

*New in 5.2.* Where ``install online-invokers`` downloads API definitions from.

.. code-block:: yaml

   opencelium:
     invoker-repository:
       url: https://api.github.com/repos/opencelium/invoker/contents
       branch: main

**url** is the GitHub *Contents API* URL of the folder holding the ``.xml``
files; **branch** is the branch, tag or commit to read. Point them at a fork to
distribute your own API definitions the same way.

spring.security.ldap
====================

.. code-block:: yaml

   spring:
     security:
       ldap:
         urls: ldap://localhost:7389
         user-search-base: ou=User,ou=group,dc=domain,dc=com
         group-search-base: ou=Groups,ou=group,dc=domain,dc=com
         username: uid=super_user,ou=User,ou=group,dc=domain,dc=com
         password: PASSWORD
         # OpenLDAP usually uniqueMember={0}; Active Directory member={0}
         group-search-filter: (member={0})
         # OpenLDAP usually mailPrimaryAddress={0}; Active Directory mail={0}
         user-search-filter: (mailPrimaryAddress={0})
         group-role-mapping:
           - ldap-group: cn=AdminLdap,ou=Groups,ou=group,dc=domain,dc=com
             oc-role: Admin
           - ldap-group: cn=UserLdap,ou=Groups,ou=group,dc=domain,dc=com
             oc-role: User
         default-role: User
         timeout: 30000

.. warning::
   This moved in 5.0 — it was ``spring.data.ldap``. An ``application.yml``
   carried over from 4.x unchanged will silently stop authenticating against
   LDAP.

Debug logging moved with it:

.. code-block:: yaml

   logging:
     level:
       org:
         springframework:
           security:
             ldap: OFF        # OFF or DEBUG

.. note::
   OpenLDAP normally wants lowercase ``cn``, ``ou``, ``dc`` in the role mapping;
   Active Directory wants uppercase ``CN``, ``OU``, ``DC``.

Test the result under **Users & Access → LDAP Check**.

spring.mail
===========

Required for password resets and e-mail notifications. Without it the mail sender
does not exist at all and :ref:`ref-system-check` reports Email as *Down*.

.. code-block:: yaml

   spring:
     mail:
       opencelium:
         from: noreply@opencelium.io
       host: smtp.example.com
       port: 587
       username:
       password:
       properties:
         mail:
           smtp:
             auth: true
             connectiontimeout: 5000
             timeout: 5000
             writetimeout: 5000
             starttls:
               enable: true

The health check performs a real connection test, so the host must actually be
reachable — a wrong port shows up as *Down* with the reason.

log.retention
=============

How many execution logs are kept per workflow.

.. code-block:: yaml

   log:
     retention:
       per-connection:
         success: 2
         fail: 3

Older logs beyond these limits are removed automatically. Logs are only recorded
for schedules that have logging enabled.

Corrected keys
==============

Two keys in the default file were misspelled before 5.0. If you copied them, fix
them:

.. list-table::
   :header-rows: 1
   :widths: 50 50

   * - Wrong
     - Correct
   * - ``spring.jpa.hibernate.dll-auto``
     - ``spring.jpa.hibernate.ddl-auto``
   * - ``spring.web.resources.add-mappings=false:``
     - ``spring.web.resources.add-mappings: false``

Frontend runtime configuration
==============================

The frontend reads ``config.json``, served next to ``index.html``, at runtime —
so endpoints can be changed in a deployed installation without a rebuild.

.. code-block:: json

   {
     "server": { "protocol": "", "hostname": "", "port": "", "prefix": "/api" },
     "socket": { "protocol": "", "hostname": "", "port": "", "prefix": "/ws" }
   }

Empty ``protocol`` and ``hostname`` mean "same origin as the frontend". To reach
a backend elsewhere, fill them in:

.. code-block:: json

   {
     "server": { "protocol": "https", "hostname": "oc.example.com", "port": "9090", "prefix": "" },
     "socket": { "protocol": "https", "hostname": "oc.example.com", "port": "9090", "prefix": "/ws" }
   }

.. note::
   ``settings.json`` and ``window.config.env.urlInfo`` from earlier versions are
   no longer used.

Reverse proxy
=============

Both ``/api`` and ``/ws`` must be proxied. The shipped
``conf/nginx_default.conf`` does this; a config that forwards only ``/api``
breaks test runs, the live dashboard and support-log notifications.

.. code-block:: nginx

   location /api/ {
           proxy_pass http://localhost:9090/;
           client_max_body_size 200M;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Master-Password $http_x_master_password;
           proxy_set_header X-Forwarded-Proto http;
   }

   location /ws/ {
           proxy_pass http://localhost:9090/ws/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
   }

Ready-made nginx and Apache configurations are in
`conf/ <https://github.com/opencelium/opencelium/tree/prod/conf>`_.
