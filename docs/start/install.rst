#############
Quick install
#############

The fast path to a running instance.

Check the requirements
======================

Make sure the host meets :doc:`../operations/requirements`.

Install the packages
====================

The commands below cover the common case. For the full per-distribution
instructions, SSL, Docker and Apache, see
:doc:`../operations/install-packages`.

**Debian / Ubuntu**

.. code-block:: sh

   apt update
   apt install -y opencelium

**SUSE Linux Enterprise**

.. code-block:: sh

   zypper refresh
   zypper install -y OpenCelium

**RedHat**

.. code-block:: sh

   yum install -y OpenCelium

The package pulls in the databases and the web server configuration. Full
listings, including the ZIP installation and Docker Compose, are in
:doc:`../operations/install-packages`.

First login
===========

Open ``http://<host>`` and sign in:

* **login:** ``admin@opencelium.io``
* **password:** ``1234``

Change that password immediately, under the profile icon in the top bar.

Verify the installation
=======================

Open **License & System → System Check** (admin menu, ``Alt+M``). MariaDB,
MongoDB, OpenCelium and the operating system should all report *Operational*.

Email is *Down* until you configure ``spring.mail`` — password resets and e-mail
notifications need it. Polyglot is *Down* until you deploy the polyglot engine
(:ref:`ref-config-polyglot-service`), which is only needed for Python and Ruby
enhancements. Both are configured in :ref:`ref-configuration`.

Neither one being *Down* stops OpenCelium from working — both are optional
components.

Where to go next
================

* :doc:`first-workflow` — build something.
* :doc:`../guides/users-and-permissions` — add accounts.
* :doc:`../guides/configure-the-system` — tune ``application.yml``.
