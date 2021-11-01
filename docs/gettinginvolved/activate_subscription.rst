##################
Activate Subscription
##################

.. note::
	Make sure that you already got you subscription. If in doubt, contact our support support@opencelium.io.


Follow the steps
"""""""""""""""""

1. Add suscription repo into opencelium installtion:

.. code-block:: sh
	:linenos:

	root@shell> cd /opt/src/
	root@shell> git clone https://bitbucket.org/becon_gmbh/opencelium.pro.git // replace <username>
	root@shell> cp -r opencelium.pro/* .
	root@shell> cp -r opencelium.pro/.* .
	root@shell> rm -rf opencelium.pro

2. Restart backend:

.. code-block:: sh
	:linenos:

	root@shell> oc restart_backend