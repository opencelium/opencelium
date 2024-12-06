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


Logging
"""""""""""""""""

| If you want to have a look into OpenCelium Logs please use:

.. code-block:: sh
	:linenos:
	
	journalctl -xe -u opencelium -f


Backup
"""""""""""""""""

To create a local backup of your OpenCelium installation please execute the following command as root.
Please change MySQL username and password to your needs. Old backups will be removed after 14 days.

.. code-block:: sh

	oc backup -d /var/backups/opencelium -u opencelium -p secret1234

This will include:
- MySQL database dump
- MongoDB database dump
- backup of the installation directory /opt/opencelium/


Restore
"""""""""""""""""

We decided to not provide a automatic functionallity for the restore process, because its mostly not needed to restore everything
at once.

**Extract the backup of your choice:**

.. code-block:: sh

	tar xf /var/backups/opencelium/20241203.tar.gz -C /var/backups/opencelium/


**Restore MySQL database:**

.. code-block:: sh

	mysql -uopencelium -psecret1234 opencelium < oc_data.sql


**Restore MongoDB database (folder opencelium within backup):**

.. code-block:: sh

	mongorestore --drop --db opencelium opencelium/


Restore files and folders:
In case you have to replace single files and folders, you will have all backuped files within the extracted
backup in opt-backup.
