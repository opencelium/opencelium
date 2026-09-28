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

**Python or Ruby enhancements behave as if they were JavaScript.**
Either the polyglot engine is unreachable — check the Polyglot row in System
Check — or the configuration block is at the top level of ``application.yml``
instead of under ``opencelium:``, in which case it binds nothing and fails
silently. See :ref:`ref-config-polyglot`.

**Password reset does nothing.**
``spring.mail`` is not configured, so there is no mail sender at all. System
Check reports Email as *Down*.

**"Another schedule for this connection is already running."**
Only one schedule per workflow runs at a time. Wait, or terminate the running
execution from the schedule list.

**Saving a workflow is refused with OPERATOR_EXPRESSION_IS_EMPTY.**
An ``If`` or ``Loop`` operator has no condition. The editor outlines the offending
node in red; open it and define the condition.

**Saving is refused with CONNECTOR_NOT_FOUND.**
A step references a connector that has been deleted. Open the step and pick a
current connector.

**A template will not load, or loads with unresolved connectors.**
Templates carry invoker names rather than connector IDs. The *Map template
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
the invoker files as a ZIP, with a masking level you choose so payloads do not
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

        ln -s /opt/scripts/oc_service.sh /usr/bin/oc
        
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
