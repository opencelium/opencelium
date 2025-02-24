##################
Administration
##################

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


Routing of the backend through an endpoint
"""""""""""""""""

To change this routing you need to follow the next steps.

**1. Change routing in frontend:**

Create a settings.json file inside of frontend directory (usually underneath /opt/opencelium/src/frontend/) and change the settings to this.

.. code-block:: sh

	{
		"PORT": {
		"APPLICATION": "",
		"API": ""
	},
	"SERVER_ENDPOINT": "/api/"
	}

**2. Add proxy in the webserver config:**

Open the settings of your webserver (usually it is nginx) and add the follow config:

.. code-block:: sh

	# Activate Proxy
	location /api/ {
		# Routing of all requests to /api to the backend server. pls replace {localhost}
		proxy_pass http://localhost:9090/;

		#Set proxy header
		proxy_set_header X-Forwarded-For $remote_addr;
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


Backup
"""""""""""""""""

Execute this command to create a backup.

.. code-block:: sh

	oc backup -d /var/backups/opencelium -u username -p password



Logging
"""""""""""""""""

| If you want to have a look into OpenCelium Logs please use:

.. code-block:: sh
	:linenos:
	
	journalctl -xe -u opencelium -f
