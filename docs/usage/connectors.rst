##################
Connectors
##################

.. contents::
   :local:

A connector is a core component of OpenCelium. It represents an external or
internal system to which requests are sent and from which responses are
received. Connectors can use different protocols — HTTP, JSON-RPC, SOAP and so
on; currently HTTP and JSON-RPC are available. A connector always uses an
**invoker**, the file that describes the system's authentication and operations.

Connector List
""""""""""""""

Each row displays the connector's title, its icon, the description and the
invoker it was assigned to. The search field filters the list, the columns are
sortable, and the per-row actions are *view*, *update* and *delete*, each with a
tooltip.

Viewing a connector shows the description of the connector itself and the
information about its invoker: title, description, hint and operations.

Creating and updating a connector
"""""""""""""""""""""""""""""""""

The wizard has two steps.

**General Data** defines the basic configuration:

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Field
     - Description
   * - **Title**
     - Required. Checked for uniqueness.
   * - **Description**
     - Free text.
   * - **Invoker**
     - Required. Determines which credential fields the next step shows.
   * - **Invoker description**
     - Shown read-only for the selected invoker.
   * - **Timeout**
     - Connection timeout, default ``1000``.
   * - **SSL certificate**
     - Enables or disables the secure protocol. Disabled by default.
   * - **Icon**
     - An image for the connector.

When you update a connector, the icon field offers a **radio choice** instead of
a delete checkbox: *leave the current icon*, *delete it*, or *set a new one*.
Icons have their own endpoints in 5.0 (``POST``/``DELETE /connector/{id}/icon``).

**Credentials** contains the invoker-specific fields required to authenticate
and communicate with the target system. Which fields appear, and whether they
are mandatory, comes from the invoker. Password fields have a visibility toggle.

Testing the connection
======================

Use **Test connection** in the credentials step before you submit. If the test
fails you are notified, and the wizard asks you to confirm explicitly before
saving anyway — so a failing connector is never stored by accident.

Connectors are also health-checked from the workflow editor: the method sidebar
and the connector nodes show a live status dot per connector. See
:ref:`usage-workflow` for the meaning of the colours.

Required data
=============

A connector's required data can be updated on its own
(``PUT /connector/{id}/required-data``) without going through the whole wizard.
The credentials step shows a hint about this, and fields that the invoker marks
as disabled are shown as such.

.. note::
   Validation of the credentials is only enforced when a master password is
   configured. See below.

Master Password
"""""""""""""""

The *Master Password* protects the credentials of a connector. Normally the
authentication information of an API is stored with the connector and can be
viewed by anyone who may read it.

With the master password active, credentials are only revealed after the password
has been entered.

To enable it, set the password in ``application.yml``. Either edit the file
directly:

.. code-block::

   /opt/opencelium/src/backend/src/main/resources/application.yml

.. code-block::

   opencelium:
      [...]
      connector:
         master-password: {YOURPASSWORD}

…or use the :ref:`System Configuration <admin_panel-system_config>` page, which
edits the same file from the UI.

Save and restart the backend. After restarting and logging in again the function
is active; enter the password to display the credentials.

.. note::
   Once the master password has been entered, the credentials of all connectors
   are displayed until the browser is closed again.

.. note::
   The master password only accepts ASCII characters. It also gates two 5.0
   features that read connector configuration: browsing a connector's GraphQL
   schema in the workflow editor, and the
   :ref:`System Configuration <admin_panel-system_config>` page.
