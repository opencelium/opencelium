##################
Administration
##################

.. contents::
   :local:

Services
"""""""""""""""""

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

Editing application.yml
"""""""""""""""""""""""

The backend is configured in

.. code-block::

   /opt/opencelium/src/backend/src/main/resources/application.yml

If the file does not exist yet, copy the documented default next to it:

.. code-block:: sh

   cp /opt/opencelium/src/backend/src/main/resources/application_default.yml \
      /opt/opencelium/src/backend/src/main/resources/application.yml

Since 5.0 the same file can be edited from the user interface under
**License & System → Configurations**, which keeps the inline comments,
comments sections in and out, masks secrets and creates a backup before every
write. See :ref:`admin_panel-system_config`.

.. warning::
   Whichever way you edit it, the backend has to be **restarted** before the
   change takes effect.

The location of the file that the endpoint reads and writes, and the backup
behaviour, are configured in the file itself:

.. code-block:: yaml

   opencelium:
     config:
       # application.yml on disk to read and write
       file-path: ./application.yml
       backup:
         # where pre-write backups go (.bak.<epochMillis>)
         directory: runtime/backup/application
         # how many recent backups to retain per target file
         keep: 10

.. _getting_started-administration-sweeper:

Sweepers
""""""""

A *sweeper* is a periodic background job that cleans up leftovers. 5.0
introduces one for test connections: every test run in the workflow editor
creates a temporary connection, and the sweeper permanently removes the ones that
were left behind. A test connection that is currently running is never deleted.

.. code-block:: yaml

   opencelium:
     sweeper:
       test-connection:
         # turn the sweeper on/off (default: true)
         enabled: true
         # milliseconds between runs, non-overlapping
         fixed-delay: 900000
         # milliseconds before the first run; 0 also cleans at startup
         initial-delay: 0

Leftover test connections can also be removed on demand with
``DELETE /connection/test``.

.. _getting_started-administration-ldap:

LDAP
""""

LDAP authentication is configured in ``application.yml``. In 5.0 the section
moved from ``spring.data.ldap`` to ``spring.security.ldap``:

.. code-block:: yaml

   spring:
     security:
       ldap:
         # LDAP server URL
         urls: ldap://localhost:7389
         # further LDAP settings

The debug switch moved accordingly, from
``logging.level.org.springframework.data.ldap`` to
``logging.level.org.springframework.security.ldap``:

.. code-block:: yaml

   logging:
     level:
       org:
         springframework:
           security:
             # Activate or deactivate logs during LDAP authentication
             ldap: OFF # OFF or DEBUG

.. warning::
   If you carry an ``application.yml`` from 4.x over to 5.0 unchanged, the old
   ``spring.data.ldap`` block is ignored and LDAP logins stop working. Move the
   block to ``spring.security.ldap``.

The effective configuration can be reviewed and tested in the UI under
**Users & Access → LDAP Check**.

Routing of the backend through an endpoint
"""""""""""""""""""""""""""""""""""""""""""

To change this routing you need to follow the next steps.

**1. Change routing in frontend:**

.. note::
   This changed in 5.0. The frontend is built with Vite and reads its endpoints
   at **runtime** from ``config.json`` next to ``index.html``, so the values can
   be changed after the build without rebuilding the application. The
   ``settings.json`` file of earlier versions is no longer used.

The production build already ships the reverse-proxy defaults — an empty host
and port with the ``/api`` and ``/ws`` prefixes:

.. code-block:: json

	{
	  "server": {
	    "protocol": "",
	    "hostname": "",
	    "port": "",
	    "prefix": "/api"
	  },
	  "socket": {
	    "protocol": "",
	    "hostname": "",
	    "port": "",
	    "prefix": "/ws"
	  }
	}

Empty ``protocol`` and ``hostname`` mean "same origin as the frontend". To talk
to a backend on another host, or directly on port 9090 without a proxy, fill the
fields in:

.. code-block:: json

	{
	  "server": {
	    "protocol": "https",
	    "hostname": "oc-backend.example.com",
	    "port": "9090",
	    "prefix": ""
	  },
	  "socket": {
	    "protocol": "https",
	    "hostname": "oc-backend.example.com",
	    "port": "9090",
	    "prefix": "/ws"
	  }
	}

.. note::
   ``socket`` must point at the WebSocket endpoint. The workflow test run, the
   live dashboard metrics and the support-log notifications all depend on it, so
   an unreachable socket shows up as *Connection lost — data may be stale* on the
   dashboard.

**2. Add proxy in the webserver config:**

Open the settings of your webserver (usually it is nginx) and add the follow config:

.. code-block:: sh

	# Activate Proxy
	location /api/ {
		# Routing of all requests to /api to the backend server. pls replace {localhost}
		proxy_pass http://localhost:9090/;
		client_max_body_size 200M;

		#Set proxy header
		proxy_set_header X-Forwarded-For $remote_addr;
		proxy_set_header X-Master-Password $http_x_master_password;
		proxy_set_header X-Forwarded-Proto http;

		# Optional: CORS headers
		add_header Access-Control-Allow-Origin "*";
		add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
		add_header Access-Control-Allow-Headers "Content-Type, Authorization";

		# Handle preflight requests
		if ($request_method = OPTIONS) {
			add_header Content-Length 0;
			add_header Content-Type text/plain;
			return 204;
		}
	}

	# Activate proxy for websocket
	location /ws/ {
		proxy_pass http://localhost:9090/ws/;
		proxy_http_version 1.1;

		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "Upgrade";

		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}

.. note::
	| You can get the webserver configs for nginx and apache2 underneath the conf directory.
	|
	| https://github.com/opencelium/opencelium/tree/prod/conf

**3. Restart your webserver:**

.. code-block:: sh

	systemctl restart nginx


Check health
"""""""""""""""""

Check status of opencelium service

.. code-block:: sh

	systemctl status nginx
	systemctl status opencelium
	
	
Autostart
"""""""""""""""""

Start opencelium services automatically on system start

.. code-block:: sh

	systemctl enable nginx
	systemctl enable opencelium
	

.. _getting_started-administration-logging:

Logging
"""""""

| If you want to have a look into OpenCelium Logs please use:

.. code-block:: sh
	:linenos:
	
	journalctl -xe -u opencelium -o cat -f


Backup
"""""""""""""""""

To create a local backup of your OpenCelium installation, please execute the following command as root.
Old backups will be removed after 14 days.

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh

	oc backup -d /var/backups/opencelium -u opencelium -p secret1234

| This will include:
| - MySQL database dump
| - MongoDB database dump
| - backup of the installation directory /opt/opencelium/


Restore
"""""""""""""""""

We decided not to provide an automatic functionallity for the restore process, because it's mostly not needed to restore everything
at once.

**Extract the backup:**

.. code-block:: sh

	mkdir /var/backups/opencelium/restore
	ls -l /var/backups/opencelium

.. note::
	Please change the <backup filename> in the following command line!

.. code-block:: sh	
	
	tar xf /var/backups/opencelium/<backup filename>.tar.gz -C /var/backups/opencelium/restore/ --strip-components=4


**Restore MySQL database: (Connectors, Workflows and Schedules)**

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh

	mysql -uopencelium -psecret1234 opencelium < /var/backups/opencelium/restore/oc_data.sql


**Restore MongoDB database (workflow documents)**

.. code-block:: sh

	mongorestore --drop --db opencelium /var/backups/opencelium/restore/opencelium/


**Restore files and folders: (all programm files, invokers and templates)**

In case you have to replace single files and folders, you will find all backuped files within the extracted
backup in /var/backups/opencelium/restore/opt-backup .
