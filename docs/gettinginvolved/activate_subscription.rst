##################
Activate Subscription
##################

.. note::
	Make sure that you have already got your subscription. If in doubt, contact our support support@opencelium.io.


Follow the steps
"""""""""""""""""

1. Get your invitation from subscription repository:

Send an email to support@opencelium.io to get your invitation. Please use your company email address.


2. Add subcription repository into opencelium installation:

.. code-block:: sh
	:linenos:

	root@shell> cd /opt/src/
	root@shell> git clone https://<username>@bitbucket.org/becon_gmbh/opencelium.pro.git // replace <username>
	root@shell> cp -r opencelium.pro/* .
	root@shell> cp -r opencelium.pro/.* .
	root@shell> rm -rf opencelium.pro
	root@shell> git config --global credential.helper store // use your bitbucket credentials

3. Restart oc:

.. code-block:: sh
	:linenos:

	root@shell> oc restart_frontend
	root@shell> oc restart_backend