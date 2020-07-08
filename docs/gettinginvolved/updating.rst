##################
Updating
##################

From OC 1 or earlier
"""""""""""""""""

.. code-block:: sh
	:linenos:
	
	root@shell> git checkout tags/<version> // e.g 1.1 
	root@shell> cd /opt/src/backend
	root@shell> gradle build
	root@shell> cd /opt/src/frontend
	root@shell> yarn
	root@shell> yarn upgrade
