.. _guide-configure-system:

##########################
Configure the system
##########################

.. contents::
   :local:

Since 5.0 ``application.yml`` can be edited from the interface, so a configuration
change no longer needs shell access. The full key reference is
:doc:`../reference/configuration`.

Open it
=======

**License & System → System Configuration** (admin menu, ``Alt+M``). The
palette equivalent is ``update system-config``.

The page requires the **master password**. If none is configured it says so; set
``opencelium.connector.master-password`` in the file directly and restart, then the
UI is available for everything else.

.. image:: ../img/admin5/OC5_system-config-tree.png
   :align: center
   :width: 1000

How the editor works
====================

The file is a tree of nodes, each with a path, a value and a status.

* **Checkbox = active or commented out.** Unticking a node comments it out on save;
  ticking uncomments it. The change **cascades**: disabling a section disables its
  contents, enabling a nested key enables the parent keys it needs, and disabling
  the last active child of a section comments the section out too.
* **Comments are preserved.** Nodes whose YAML carries a comment show an info icon —
  hover it. This is how the inline documentation of ``application_default.yml``
  stays available in the UI.
* **Secrets are masked.** Passwords and tokens are not sent to the browser in
  clear; type a new value to replace one.
* **Search** filters by field name. *Expand all* / *Collapse all* fold the tree.
* **Reset** discards your edits and reloads from the server.

.. warning::
   Changes are written immediately but take effect only after a **restart**. The
   page shows a *Restart required* notice after saving.

Backups
=======

Every write is backed up first, to ``<file>.bak.<epochMillis>``. Location and
retention are themselves configuration:

.. code-block:: yaml

   opencelium:
     config:
       file-path: ./application.yml
       backup:
         directory: runtime/backup/application
         keep: 10

These are convenience snapshots. For real backups see
:doc:`../operations/backup-and-restore`.

Which file the page edits
=========================

The page reads and writes the file named by ``file-path`` above. Since 5.3 its
default is ``./application.yml``, resolved against the backend's working
directory (``/opt/opencelium/src/backend`` with the shipped service). On a
standard installation the file is in ``src/main/resources/``, so that default
points at a file that does not exist: the page still shows values, but saving
fails with *Cannot write to ./application.yml: file does not exist on disk*.

Fix it once, in the file itself:

* set ``file-path`` to the real file, for example
  ``src/main/resources/application.yml``, or
* set the environment variable ``OPENCELIUM_CONFIG_FILEPATH`` to the absolute
  path of ``application.yml`` for the service. It takes precedence over
  ``file-path`` and is also used by the startup configuration migration.

The lookup order and an example for systemd are in :ref:`ref-config-file`.

.. versionchanged:: 5.3
   The default of ``file-path`` changed from ``src/main/resources/application.yml``
   to ``./application.yml``, and ``OPENCELIUM_CONFIG_FILEPATH`` is new.
   Installations updated from 5.2 keep their existing value.

Editing a single value from the palette
=======================================

``system config <query>`` searches the configuration and edits one value in place —
quicker than the full page when you know what you are changing.

Editing the file directly
=========================

Still perfectly valid:

.. code-block:: sh

   /opt/opencelium/src/backend/src/main/resources/application.yml
   systemctl restart opencelium

Use this for the master password itself, and whenever the UI is not reachable.
If you keep the file elsewhere, edit the file ``OPENCELIUM_CONFIG_FILEPATH``
points at.

Key for secret global variables
===============================

.. versionadded:: 5.3

Secret :doc:`global variables <global-variables>` are encrypted with
``opencelium.global-variable.secret-key`` (or the environment variable
``OPENCELIUM_GLOBALVARIABLE_SECRETKEY``, which takes precedence). Set it to a
long random string **before the first secret is saved**: when it is empty, a
built-in key is used that is the same on every installation. There is no key
rotation — after a change every secret has to be entered again. See
:ref:`ref-config-global-variable`.

Appearance
==========

The **UI** entry (``/ui/config``) holds the theme, stored per user. The palette
equivalent is ``ui theme``. Light and dark are supported everywhere, including the
workflow canvas and the log viewer.
