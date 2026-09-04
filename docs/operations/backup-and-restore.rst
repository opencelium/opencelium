.. _ops-backup:

##################
Backup and restore
##################

.. contents::
   :local:

.. warning::
   Always take a full backup before updating. See :doc:`updating`.

What has to be backed up
========================

OpenCelium keeps state in three places, and a usable backup needs all of them:

.. list-table::
   :header-rows: 1
   :widths: 26 74

   * - Where
     - What
   * - **MariaDB**
     - Users, groups, connectors, schedules, categories, license tracking.
   * - **MongoDB**
     - The workflow documents — the integrations themselves.
   * - **Filesystem**
     - ``application.yml``, the ``invoker`` and ``templates`` directories, and
       ``upload-dir`` (icons, support bundles).

Restoring only the SQL database leaves you with connectors and schedules pointing
at workflows that no longer exist.

.. note::
   ``opencelium.config.backup`` keeps automatic copies of ``application.yml``
   whenever it is written through the UI — see :ref:`ref-config-file`. Those are
   convenience snapshots, not a backup strategy.

Backup
=========

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

Full Restore
=======

To restore a local backup of your OpenCelium installation, please execute the following command as root.

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh

	oc restore -d /var/backups/opencelium -u opencelium -p secret1234 -n <backup filename>

| This will include:
| - MySQL database restore
| - MongoDB database restore
| - restore of the installation directory /opt/opencelium/


Partitial Restore
=======

Mostly it is not needed to restore everything at once.
A partial restore of OpenCelium allows you to selectively recover specific components such as databases or files.

**Extract the backup:**

.. code-block:: sh

	mkdir /var/backups/opencelium/restore
	ls -l /var/backups/opencelium

.. note::
	Please change the <backup filename> in the following command line!
.. code-block:: sh	
	
	tar xf /var/backups/opencelium/<backup filename>.tar.gz -C /var/backups/opencelium/restore


**Restore MySQL database: (Connectors, Workflows and Schedules)**

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh

	mysql -uopencelium -psecret1234 opencelium < /var/backups/opencelium/restore/oc_data.sql


**Restore MongoDB database (workflow documents)**

.. code-block:: sh

	mongorestore --drop --db opencelium /var/backups/opencelium/restore/opencelium/


**Restore files and folders: (all programm files, invokers and templates)**

In case you have to replace single files and folders, you will find all backuped files within the extracted
backup in /var/backups/opencelium/restore/opt-backup .
