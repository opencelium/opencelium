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

Choose your backup filename.

.. code-block:: sh	
	
	tar xf /var/backups/opencelium/<backupfile>.tar.gz -C /var/backups/opencelium/restore/ --strip-components=4


**Restore MySQL database:**

.. note::
	Please change MySQL username and password (opencelium/secret1234) to your needs in the following command line!

.. code-block:: sh

	mysql -uopencelium -psecret1234 opencelium < /var/backups/opencelium/restore/oc_data.sql


**Restore MongoDB database (folder opencelium within backup):**

.. code-block:: sh

	mongorestore --drop --db opencelium /var/backups/opencelium/restore/opencelium/


**Restore files and folders:**

In case you have to replace single files and folders, you will find all backuped files within the extracted
backup in /var/backups/opencelium/restore/opt-backup .
