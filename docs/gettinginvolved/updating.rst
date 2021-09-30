##################
Updating
##################

Till OC 1.4.1
"""""""""""""""""

.. code-block:: sh
	:linenos:
	
	root@shell> cd /opt
	root@shell> git pull
	root@shell> git checkout tags/<version> // e.g 1.1 
	root@shell> cd /opt/src/backend
	root@shell> gradle build
	root@shell> cd /opt/src/frontend
	root@shell> yarn upgrade

From OC 2.0
"""""""""""""""""

Please use Update Assistant to update OpenCelium from version 2.0. You can find
more in the documentation of `Usage/Admin Panel
<https://docs.opencelium.io/en/dev/usage/admin.html#update-assistant>`_ chapter.