##################
Administration
##################

Services
"""""""""""""""""

Run command to enable oc service.

.. code-block:: sh

        root@shell> ln -s /opt/scripts/oc_service.sh /usr/bin/oc

**Available services:**

- oc rebuild_frontend
- oc start_frontend
- oc stop_frontend
- oc restart_frontend
- oc check_frontend
- oc refresh_db
- oc rebuild_backend
- oc start_backend
- oc stop_backend
- oc restart_backend
- oc check_backend
- oc backup
- oc restore


Check health
"""""""""""""""""

Add this to you crontab.

- */5 * * * * /usr/bin/oc check_frontend >/dev/null 2>&1
- */5 * * * * /usr/bin/oc check_backend >/dev/null 2>&1


Backup
"""""""""""""""""

Execute this command to create a backup.

.. code-block:: sh

        root@shell> oc backup -d /var/backup -u username -p password -name backupfile


Restore
"""""""""""""""""

Execute this command to restore from a backup.

.. code-block:: sh

        root@shell> oc restore -d /var/backup -u username -p password -name backupfile
