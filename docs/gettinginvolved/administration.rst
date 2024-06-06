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


