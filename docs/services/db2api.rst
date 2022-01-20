##################
Activate db2api
##################

.. note::
	db2api is a subscription connector. Make sure that you have already got your subscription. If in doubt, contact our support support@opencelium.io. 


Installation
"""""""""""""""""

.. code-block:: sh
        :linenos:

        root@shell> cd /opt/services
        root@shell> git clone https://github.com/opencelium/db2api.git

Please read default documentation here https://github.com/opencelium/db2api#user-content-installation

Usage
"""""""""""""""""
Please read usages here https://github.com/opencelium/db2api#user-content-usage


Services
"""""""""""""""""

Use the oc command to start the service.

- start_db2api
- stop_db2api

FAQ
"""""""""""""""""

**SQL Server does not support TLSv1 or TLSv1.0**
Go to folder java/security and in file java.security find option jdk.tls.disabledAlgorithms and delete TLSv1
