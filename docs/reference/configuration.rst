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

To keep the file somewhere else, set the environment variable
``OPENCELIUM_CONFIG_FILEPATH`` to its location — see :ref:`ref-config-file`.

Since 5.0 the same file can be edited from the UI — see
:doc:`../guides/configure-the-system`. Either way, **the backend must be
restarted** for a change to take effect.

.. _ref-config-file:

opencelium.config
=================

Where the ``/application-config`` endpoint (the **System Configuration** page)
reads and writes, and how it keeps backups.

.. code-block:: yaml

   opencelium:
     config:
       # the application.yml on disk to read and write
       file-path: ./application.yml
       backup:
         # pre-write backups, named <file>.bak.<epochMillis>
         directory: runtime/backup/application
         # how many recent backups to keep per target file
         keep: 10

.. versionchanged:: 5.3
   The default of ``file-path`` is now ``./application.yml`` (it was
   ``src/main/resources/application.yml``), and the environment variable
   ``OPENCELIUM_CONFIG_FILEPATH`` can set the location instead.

The location of ``application.yml`` is looked up in this order:

#. the Java system property ``-Dopencelium.config.file-path=...``,
#. the environment variable ``OPENCELIUM_CONFIG_FILEPATH``,
#. for the System Configuration page: the ``file-path`` key above; for
   startup: ``src/main/resources/application.yml``.

A relative path is resolved against the backend's working directory —
``/opt/opencelium/src/backend`` with the shipped systemd unit. Besides the
System Configuration page, the startup configuration migration and Spring's
config location follow the system property and the environment variable too.
The migration's backup ``application_copy.yml`` is written next to that file.

.. warning::
   With the shipped unit, ``./application.yml`` means
   ``/opt/opencelium/src/backend/application.yml``. On a standard installation
   the file lives in ``src/main/resources/``, so a ``file-path`` copied
   unchanged from ``application_default.yml`` points at a file that does not
   exist: the page still shows values, but saving fails with *Cannot write to
   ./application.yml: file does not exist on disk*. Either set ``file-path``
   to the real file (for example ``src/main/resources/application.yml``) or
   set ``OPENCELIUM_CONFIG_FILEPATH`` for the service, for example with
   ``systemctl edit opencelium``:

   .. code-block:: ini

      [Service]
      Environment=OPENCELIUM_CONFIG_FILEPATH=/opt/opencelium/src/backend/src/main/resources/application.yml

   An upgraded installation keeps the value it had: the configuration
   migration only adds missing keys.

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

.. _ref-config-forgot-psw:

opencelium.forgot-psw
=====================

Password reset links — the self-service *Forgot password* link and the one-time
link an admin creates from the user list (see
:doc:`../guides/users-and-permissions`).

.. code-block:: yaml

   opencelium:
     forgot-psw:
       # the frontend's set-password page; reset and admin links add ?token=...
       base-url: https://frontend.example.com/set-password
       token-activity-time: 240000          # ms a self-service link stays valid
       max-email-validation-attempts: 3
       lockout-time: 480000
       admin-link-activity-time: 86400000   # ms an admin-issued link stays valid (24 h)

.. versionchanged:: 5.3
   The default of ``base-url`` now ends in ``/set-password`` (it was
   ``/reset-password``), and ``admin-link-activity-time`` is new.

An existing value is not rewritten on upgrade. Links that still point at
``/reset-password`` keep working — the frontend forwards them to
``/set-password`` — but set ``base-url`` to ``https://<your host>/set-password``.
Without ``base-url`` an admin cannot create a reset link.

.. _ref-config-global-variable:

opencelium.global-variable
==========================

.. versionadded:: 5.3

Limits and the encryption key for :doc:`global variables
<../guides/global-variables>`.

.. code-block:: yaml

   opencelium:
     global-variable:
       secret-key: ""               # key for secret values; see below
       max-value-bytes: 65536       # largest value of one variable, in bytes
       max-script-bytes: 262144     # largest code of one script variable, in bytes
       script-timeout-ms: 5000      # how long a script variable may run (in a workflow and in a test)
       queue:
         max-waiting: 100           # starts that may wait per workflow; one more is refused
         max-wait-minutes: 60       # how long a start may wait before it is dropped
       change-log:
         max-run-entries: 200       # run-write entries kept per variable; oldest go first

**queue** applies to workflows that use a mutable global variable: they run one
execution at a time, and with the busy policy *Queue* a further start waits for
the running one.

.. warning::
   **Set** ``secret-key`` **before the first secret value is saved.** It
   encrypts secret constants. When it is empty, a built-in default key is used —
   the same on every installation, so it hides the values but does not protect
   them. Use a long random string and keep a copy apart from your database
   backups. The environment variable ``OPENCELIUM_GLOBALVARIABLE_SECRETKEY``
   takes precedence over the file.

   There is no key rotation: a secret saved under one key cannot be read under
   another, so after changing the key every secret has to be entered again.

.. _ref-config-code-only:

Keys without a default entry
============================

.. versionadded:: 5.3

These optional keys are read by the backend but are not in
``application_default.yml``. Add them under ``opencelium:`` only if you need a
different value.

.. list-table::
   :header-rows: 1
   :widths: 40 15 45

   * - Key
     - Default
     - What it does
   * - ``opencelium.login.max-failures-per-account``
     - ``5``
     - Failed sign-ins per account within the window before further attempts
       are refused with HTTP 429.
   * - ``opencelium.login.max-failures-per-client``
     - ``20``
     - Failed sign-ins per client address within the window.
   * - ``opencelium.login.failure-window``
     - ``900000``
     - Length of the sliding window, in ms (15 minutes).
   * - ``opencelium.connector.token-cache-ttl``
     - ``300000``
     - How long, in ms, a login token computed by an API definition is cached
       for single requests such as the Request Playground.
   * - ``opencelium.script-run.timeout``
     - ``5s``
     - Time limit of one run in the :doc:`Script Playground
       <../guides/script-playground>`.
   * - ``opencelium.script-run.max-concurrent``
     - ``2``
     - Script Playground runs at the same time; more are refused with HTTP 429.

The login limit counts failures only and is kept in memory per backend
instance; a successful sign-in clears the failures of that account. The client
is identified by its address, which behind nginx needs both
``server.forward-headers-strategy: native`` (in the default file) and
``proxy_set_header X-Forwarded-For $remote_addr`` (in the shipped nginx
configuration). Without them all users share one client budget.

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

.. _ref-config-server-time-zone:

serverTimeZone
--------------

.. versionadded:: 5.3

.. code-block:: json

   {
     "server": { "protocol": "", "hostname": "", "port": "", "prefix": "/api" },
     "socket": { "protocol": "", "hostname": "", "port": "", "prefix": "/ws" },
     "serverTimeZone": "Europe/Berlin"
   }

An IANA time zone name. Schedule run times — the schedules calendar, the
dashboard **Schedule** card and the **Schedule Preview** under the cron field —
are shown in this zone, labelled *Times in <zone>*. Set it to the zone the
backend runs in, because that is the zone schedules fire in. When it is empty or
not a valid zone, the browser's zone is used.

.. note::
   The production build writes ``config.json`` without ``serverTimeZone``. Add
   the key by hand after building or updating the frontend.

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

.. note::
   ``client_max_body_size 200M`` limits uploads through nginx to 200 MB, while
   the backend and the upload dialogs accept up to 1 GB (templates, API
   definitions and offline update packages). If you need bigger uploads, raise
   it, for example to ``1G``; otherwise nginx answers *413 Request Entity Too
   Large*. The shipped Apache configurations set no limit.

Ready-made nginx and Apache configurations are in
`conf/ <https://github.com/opencelium/opencelium/tree/prod/conf>`_.
