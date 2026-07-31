.. _upgrade-to-5:

######################
Upgrading from 4.x
######################

.. contents::
   :local:

.. warning::
   Take a full backup before you start. See :doc:`../operations/backup-and-restore`.

5.0 is a major release. Read this page before upgrading — most of it is
reassuring, but three items will silently break things if you skip them.

The three things that bite
==========================

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Change
     - If you ignore it
   * - ``spring.data.ldap`` moved to ``spring.security.ldap``
     - LDAP logins stop working. No error explains why.
   * - ``settings.json`` replaced by ``config.json``
     - A customised backend endpoint is ignored and the frontend talks to the
       wrong host.
   * - ``/ws`` must be proxied
     - Test runs, live dashboard metrics and support-log notifications never
       arrive.

Everything else is either automatic or cosmetic.

Your workflow data is safe
==========================

Existing connections are **not rewritten in the database** by the upgrade. When
5.0 reads a document written by an older version it converts it to the new layout
**in memory, on the read path only**:

* every method is stamped with the connector it belonged to,
* indexes of the former *from* side are prefixed ``0_`` and the *to* side ``1_``,
  preserving execution order,
* methods and operators are merged under one connector container,
* field bindings are untouched — they reference methods by colour.

So you can upgrade, look at your workflows, and roll back without having migrated
anything. Templates are converted the same way.

.. warning::
   The moment you **save** a pre-5.0 workflow in 5.0, the stored document uses the
   new layout and a 4.x installation can no longer read it. Keep your backup until
   you are confident.

Adjust application.yml
======================

The backend migrates ``application.yml`` **itself** on the first start after the
upgrade. It copies the file to ``application_copy.yml`` first, applies the
changesets for every version newer than the one recorded in the file, keeps your
comments, and rolls the copy back if writing fails.

For 5.0 it adds these keys automatically — you do not have to:

.. code-block:: yaml

   opencelium:
     version: 5.0
     config:                     # the /application-config endpoint
       file-path: src/main/resources/application.yml
       backup:
         directory: runtime/backup/application
         keep: 10
     sweeper:
       test-connection:          # removes leftover test connections
         enabled: true
         fixed-delay: 900000
         initial-delay: 0

What it does **not** do is move renamed keys. Two of those need your hand:

.. code-block:: yaml

   # 4.x                                  ->  5.0
   spring:
     security:                            #  was: spring.data.ldap
       ldap:
         urls: ldap://localhost:7389
         # ...

   logging:
     level:
       org:
         springframework:
           security:                      #  was: ...springframework.data.ldap
             ldap: OFF

Two more were corrected — if you copied them from an old default file, fix the
spelling:

* ``spring.jpa.hibernate.dll-auto`` → ``spring.jpa.hibernate.ddl-auto``
* ``spring.web.resources.add-mappings=false:`` → ``spring.web.resources.add-mappings: false``

And ``opencelium.online-services.*`` ``active`` flags are real booleans now
(``false``), not quoted strings (``"false"``).

.. note::
   The LDAP move is not part of the automatic migration. If you skip it, LDAP
   logins stop working silently — the old block is simply ignored.

See :doc:`../reference/configuration`.

Adjust the frontend endpoint configuration
==========================================

The frontend is built with Vite now and reads its endpoints at **runtime** from
``config.json``, served next to ``index.html``. ``settings.json`` is ignored.

The production build already ships the reverse-proxy defaults:

.. code-block:: json

   {
     "server": { "protocol": "", "hostname": "", "port": "", "prefix": "/api" },
     "socket": { "protocol": "", "hostname": "", "port": "", "prefix": "/ws" }
   }

Empty ``protocol``/``hostname`` mean "same origin". If your backend lives
elsewhere, fill them in — and because the file is read at runtime, you can change
it in a deployed installation without rebuilding.

Proxy /ws as well as /api
=========================

5.0 leans on the WebSocket much more than 4.x: the workflow test run, the live
dashboard metrics and the support-log "file ready" notifications all use it. The
shipped ``conf/nginx_default.conf`` proxies both; a hand-written config that only
forwards ``/api`` will look fine until you try a test run.

.. code-block:: nginx

   location /ws/ {
           proxy_pass http://localhost:9090/ws/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
   }

What changed in the interface
=============================

Nothing here breaks; it is just moved.

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - 4.x
     - 5.0
   * - Connections
     - **Workflows** (main menu)
   * - Admin panel cards
     - A second **admin menu** in the sidebar, toggled with ``Alt+M``
   * - Templates (business templates)
     - **Configurations → Workflow Templates**
   * - External Applications
     - **License & System → System Check**
   * - Migration (Neo4j → MongoDB)
     - Removed — run it while still on 4.x
   * - Global search in the top bar
     - The **command palette** (``Ctrl+K``)
   * - Connection editor *Expert* / *Template* mode
     - Always the editor; load a template into it if you want one
   * - Category bar above the lists
     - **Configurations → Categories** only

The REST API deliberately did **not** change its vocabulary: endpoints are still
``/connection``, the identifier is still ``connectionId``, the permission
component is still ``CONNECTION``. Existing integrations keep working. For the
endpoint-level changes see :doc:`../reference/api`.

Coming from 3.x
===============

You cannot go straight to 5.0. Upgrade to 4.1 first, run the Neo4j→MongoDB
migration there — the tool was removed in 5.0 — and then follow this page.

Doing the upgrade
=================

The mechanics are unchanged; see :doc:`../operations/updating` for the per-platform
commands and the Update Assistant.

Afterwards, open **License & System → System Check** and confirm that MariaDB,
MongoDB, the mail server and — if you use it — the polyglot engine are all
reported as Operational.
