.. _ops-troubleshooting:

###############
Troubleshooting
###############

.. contents::
   :local:

Start here
==========

#. **License & System → System Check** — is a dependency down? See
   :ref:`ref-system-check`.
#. ``journalctl -xe -u opencelium -f`` — backend log.
#. The dashboard's socket dot — is live data arriving at all?

Symptoms
========

**LDAP logins stopped working after an upgrade.**
The configuration block moved to ``spring.security.ldap`` in 5.0. An
``application.yml`` carried over from 4.x is silently ignored. See
:ref:`ref-configuration`, then test under **Users & Access → LDAP Check** with
``logging.level.org.springframework.security.ldap: DEBUG``.

**Test runs never produce logs; the dashboard says "Connection lost".**
``/ws`` is not being proxied, or is proxied without the ``Upgrade`` headers. The
shipped ``conf/nginx_default.conf`` gets this right.

**The frontend talks to the wrong backend.**
5.0 reads ``config.json`` at runtime; ``settings.json`` is ignored. See
:ref:`ref-configuration`.

**Python or Ruby transformations behave as if they were JavaScript.**
Either the polyglot engine is unreachable — check the Polyglot row in System
Check — or the configuration block is at the top level of ``application.yml``
instead of under ``opencelium:``, in which case it binds nothing and fails
silently. See :ref:`ref-config-polyglot`.

**Password reset does nothing.**
``spring.mail`` is not configured, so there is no mail sender at all. System
Check reports Email as *Down*. The self-service reset also works only with an
email address; for users without one, an administrator creates a reset link —
see :doc:`../guides/users-and-permissions`.

**Sign-in fails with HTTP 429.**
Too many failed sign-ins: by default 5 for one account or 20 from one client
address within 15 minutes. Wait until the window has passed (the response carries
a ``Retry-After`` header) or restart the backend, which clears the in-memory
counters. If all users are blocked at once behind a reverse proxy, the backend
sees every request as coming from the proxy: check that the proxy sets
``X-Forwarded-For`` and that ``server.forward-headers-strategy: native`` is in
``application.yml``. The limits are in :ref:`ref-config-code-only`.

**System Configuration cannot save: "Cannot write to ./application.yml: file
does not exist on disk".**
The page writes to ``opencelium.config.file-path``, whose 5.3 default
``./application.yml`` resolves against the backend's working directory and does
not exist on a standard installation. Set ``file-path`` to the real file, or set
the environment variable ``OPENCELIUM_CONFIG_FILEPATH`` for the service, and
restart. See :ref:`ref-config-file`.

**Uploads larger than 200 MB fail with 413.**
nginx rejects the request before it reaches the backend: the shipped
configuration sets ``client_max_body_size 200M``, while OpenCelium accepts up to
1 GB. Raise it (for example to ``1G``) and reload nginx. See
:ref:`ref-configuration`.

**Schedule times in the calendar look shifted by some hours.**
The frontend shows run times in ``serverTimeZone`` from ``config.json``, or in
the browser's zone when that is empty or invalid. Set it to the zone the backend
runs in, for example ``"Europe/Berlin"`` — the build does not write it, so add it
again after a frontend update. See :ref:`ref-config-server-time-zone`.

**"Another schedule for this connection is already running."**
Only one schedule per workflow runs at a time. Wait, or terminate the running
execution from the schedule list. A workflow that uses a mutable global variable
with the busy policy *Queue* makes further starts wait instead; with *Refuse*,
starts through the API or a webhook answer ``409 BUSY``. See
:doc:`../guides/global-variables`.

**Saving a workflow is refused with OPERATOR_EXPRESSION_IS_EMPTY.**
An ``If`` or ``Loop`` operator has no condition. The editor outlines the offending
node in red; open it and define the condition.

**Saving is refused with CONNECTOR_NOT_FOUND.**
A step references a connector that has been deleted. Open the step and pick a
current connector.

**A template will not load, or loads with unresolved connectors.**
Templates carry API definition names rather than connector IDs. The *Map template
connectors* dialog asks which local connector each one should use — see
:doc:`../guides/reuse-with-templates`.

**Leftover test connections.**
Interrupted test runs can leave temporary connections behind. The sweeper removes
them periodically; ``DELETE /connection/test`` does it immediately. They are
excluded from the normal lists unless ``includeTest=true`` is passed.

**MongoDB "ECONNREFUSED" during installation.**
``mongod`` was not ready yet. Wait and retry the step.

Getting help
============

Generate a **support bundle** from the schedule list: it packages a run's logs and
the API definition files as a ZIP, with a masking level you choose so payloads do not
leave your system unredacted. See :doc:`../guides/debug-a-workflow`.

Then contact support@opencelium.io, or use the ticket system in the Service
Portal if you have a subscription.

Check health
"""""""""""""""""

Check status of opencelium service

.. code-block:: sh

	systemctl status nginx
	systemctl status opencelium
	
	
Logging
"""""""

| If you want to have a look into OpenCelium Logs please use:

.. code-block:: sh
	:linenos:
	
	journalctl -xe -u opencelium -o cat -f

Host-level checks
=================

Service status
==============

Check status of opencelium service

.. code-block:: sh

	systemctl status nginx
	systemctl status opencelium
	
	

Logs
====

| If you want to have a look into OpenCelium Logs please use:

.. code-block:: sh
	:linenos:
	
	journalctl -xe -u opencelium -o cat -f

Services and autostart
======================

Commands to enable Opencelium services (already done on installation).

.. code-block:: sh

        ln -s /opt/opencelium/scripts/oc_service.sh /usr/bin/oc
        
        ln -s /opt/opencelium/conf/opencelium.service /etc/systemd/system/opencelium.service 
        systemctl daemon-reload

**Available services:**

Frontend:

.. code-block:: sh

	systemctl start nginx
	systemctl stop nginx
	systemctl start nginx
	systemctl restart nginx 
	systemctl enable nginx
	systemctl disable nginx 

Backend:

.. code-block:: sh

	systemctl start opencelium
	systemctl stop opencelium
	systemctl start opencelium
	systemctl restart opencelium 
	systemctl enable opencelium
	systemctl disable opencelium 


.. _getting_started-administration-app_config:

Start opencelium services automatically on system start

.. code-block:: sh

	systemctl enable nginx
	systemctl enable opencelium
	

.. _getting_started-administration-logging:
