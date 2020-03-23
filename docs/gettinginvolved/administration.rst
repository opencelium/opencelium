##################
Administration
##################

Services
"""""""""""""""""

Run command to enable oc service.

.. code-block:: sh

        root@shell> ln -s /opt/scripts/oc_service.sh /usr/bin/oc

**Available services:**

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


Check health
"""""""""""""""""

- */5 * * * * /usr/bin/oc check_frontend >/dev/null 2>&1
- */5 * * * * /usr/bin/oc check_backend >/dev/null 2>&1
