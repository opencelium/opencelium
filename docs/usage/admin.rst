##################
Administration
##################

.. contents::
   :local:

Navigation
""""""""""

5.0 replaced the admin panel of earlier versions with a second, structured
**admin menu** in the left-hand sidebar. Switch between the main menu
(Dashboard, Connectors, Workflows, Schedules) and the admin menu with the
switcher at the top of the sidebar or with ``Alt+M``. When you switch back, the
last page you visited in that menu is restored.

The admin menu is grouped:

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Group
     - Entries
   * - **Users & Access**
     - Users, Groups, LDAP Check
   * - **Configurations**
     - Invokers, Workflow Templates, Data Aggregator, Notification Templates,
       Categories, Support Files
   * - **License & System**
     - License Management, Update Assistant, System Check, Configurations
   * - *(top level)*
     - UI

Menu entries are filtered by your permissions: an entry whose backend component
you may not read is not shown at all. Missing ``CREATE``/``UPDATE``/``DELETE``
permissions only hide the corresponding actions, not the entry.

Every leaf entry is a real link, so ``Ctrl``/``⌘``/middle-click opens it in a
new browser tab.

.. note::
   The **External Applications** and the **Migration from 3.x to 4.x** cards of
   earlier versions no longer exist. Component health is now reported by
   :ref:`admin_panel-system_check`; the Neo4j migration was retired with the
   4.x line.

Lists and wizards
"""""""""""""""""

All administration screens follow the same two patterns in 5.0.

**Lists** have a title, an explanatory subtitle, a search field, sortable
columns and per-row *view / update / delete* icons with tooltips. Selecting rows
via their checkboxes enables the bulk actions of that list.

**Wizards** are used for create, update and view. They walk through named steps,
each with its own header and subtitle, and end on a success screen that
recommends sensible follow-up actions. ``Ctrl+Enter`` advances to the next step
or submits the wizard; the Next/Submit button shows this as a tooltip. Steps that
talk to a remote system (for example the connector's *Test connection*) let you
confirm before submitting when the remote call failed.

Users
"""""

**Users & Access → Users** lists everyone who can access OpenCelium. The list
shows name, surname, e-mail address, group, and whether two-factor
authentication is enabled; name and surname are sortable and searchable, the 2FA
column is narrow and centred.

The user wizard has three steps:

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Step
     - Content
   * - **User Details**
     - Basic personal information: title, name, surname, department,
       organization, phone number and the user image. If no image was uploaded, a
       placeholder is shown.
   * - **Credentials**
     - The login credentials; the e-mail address serves as the username. The
       e-mail must be valid and at most 255 characters, the password between
       8 and 64 characters.
   * - **Role**
     - The group that defines the permission level and access rights of the
       user.

.. note::
   The user who is currently signed in cannot be deleted.

Groups
""""""

**Users & Access → Groups** lists all groups. A group defines a role and a
permission level: it controls what its users may create, read, update and
delete. The list shows the name, the description and the assigned components.

The wizard has two steps:

* **Role Details** – name, description and optionally an icon. The name is
  mandatory.
* **Permissions** – first select the components this group should have access
  to, then tick the permissions per component. At least one component
  permission is required. The *admin* column ticks all permissions of a row.

The available components are:

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Component
     - Covers
   * - ``APP``
     - Application-wide administration, including System Configuration.
   * - ``CONNECTION``
     - Workflows (the component keeps its previous name).
   * - ``CONNECTOR``
     - Connectors.
   * - ``DASHBOARD``
     - The dashboard.
   * - ``INVOKER``
     - Invokers.
   * - ``MYPROFILE``
     - The user's own profile page.
   * - ``SCHEDULE``
     - Schedules.
   * - ``USER``
     - Users.
   * - ``USERGROUP``
     - Groups.

LDAP Check
""""""""""

**Users & Access → LDAP Check** shows the effective LDAP configuration and lets
you test it. It has two steps: **Configurations**, which displays the values
currently in effect, and **Logs**, which shows the result of the test.

LDAP itself is configured in ``application.yml``. In 5.0 the section moved from
``spring.data.ldap`` to ``spring.security.ldap``, and the debug switch moved
accordingly — see :ref:`getting_started-administration-ldap`.

Invokers
""""""""

An invoker is the configuration file that describes how to talk to an API: the
authentication type, the required data fields, and the HTTP operations that
connectors of this invoker expose.

**Configurations → Invokers** lists all configured invokers. The wizard has
three steps — **General Data**, **Authentication** and **Operations**.
Invoker files can be uploaded and downloaded as XML, individually or as a ZIP
archive, from the list or from the command palette
(``upload invoker``, ``download invoker by name <name>``).

:ref:`Here <management-invoker>` you can read how to manage invokers in detail.

Workflow Templates
""""""""""""""""""

**Configurations → Workflow Templates** holds predefined workflow
configurations that are reused to create new workflows quickly. They were called
*Templates* (business templates) before 5.0.

Templates are created and applied from the workflow editor; see
:ref:`usage-workflow-templates` for saving, loading, and mapping a template's
connectors onto the connectors of the current environment.
:ref:`Here <management-business_template>` you can read how to manage them.

.. _admin_panel-data_aggregator:

Data Aggregator
"""""""""""""""

A data aggregator is a script that collects and transforms data for use in
notification templates after a workflow has been triggered. Its wizard has two
steps: **General Data** (name and arguments) and **Script** (the aggregation
logic, with autocomplete in the editor).

Aggregators are assigned to a workflow step via *Configure Aggregator* in the
node context menu or by clicking the node's aggregator badge; a step that has one
shows *Combines results from multiple calls using the "<name>" data aggregator*.
:ref:`Here <management-data_aggregator>` you can read how to manage them.

.. note::
   In schedule notifications, a data aggregator only takes effect for the
   **Post** event type.

Notification Templates
""""""""""""""""""""""

Notification templates define the content and format of the messages the system
sends from schedules, for the event types *pre*, *post* and *alert*. The wizard
has **General Data** and **Template Content**, where you pick the aggregator and
write subject and body; aggregator arguments insert dynamic values.

5.0 ships message payload templates for the common notification channels in
``src/backend/src/main/resources/notification/``:

* ``default.json`` – plain ``${subject}`` / ``${text}``,
* ``slack.json`` – a Slack *blocks* payload with a header and a ``mrkdwn``
  section,
* ``teams.json`` – a Microsoft Teams adaptive card.

:ref:`Here <management-notification_template>` you can read how to manage
notification templates.

.. _admin_panel-categories:

Categories
""""""""""

**Configurations → Categories** organises and groups workflows and schedules.
Categories can be nested — select a parent category to create a hierarchy. A
workflow carries its category on the workflow itself (``categoryId``); this page
is where the taxonomy is created, renamed and deleted.

.. note::
   In 5.0 categories are curated here only. The category bar that earlier
   versions showed above the workflow and schedule lists is not part of the
   rebuilt lists.

.. warning::
    Deleting a category recursively removes all subcategories and the workflows
    assigned to them.

Support Files
"""""""""""""

Support files are diagnostic bundles produced by workflow runs.
**Configurations → Support Files** lists them so you can download a bundle to
share it with support, or remove ones you no longer need.

* The grid lists the **workflow title**, the stored **file path**, the detected
  **timestamp** and a **status** cell. A green cell means a success archive
  (``*_s_*.zip``) exists; a red cell means only a failure archive
  (``*_f_*.zip``) was created for that run.
* The download icon fetches the ZIP. Each archive contains the serialized
  request/response bodies captured during execution, so it can be handed over
  without re-running the workflow.
* The trash icon deletes a single archive; selecting several rows enables
  **Delete Selected**.

All files follow the same layout
(``/upload-dir/support-files/<connection>/<timestamp>_<status>_<execution>.zip``),
which makes the screen a quick way to correlate a support ticket with the
matching execution ID.

Support files are also created on demand from the schedule list — with
selectable masking levels — see :ref:`scheduler_support_logs`.

License Management
""""""""""""""""""

**License & System → License Management** mirrors the workflow described in
:doc:`../management/license_management`. It shows the current subscription,
warns when the API-call quota is exhausted, and exposes *Request Activation
Request*, *Import License* and *Activate Online*.

Online activation only appears when the user has enabled **Online Service Sync**
in their profile (:ref:`usage-my_profile`), because that permission allows the
frontend to contact the Service Portal. The embedded detail view traces API
usage back to specific workflows when you debug an overage.

The command palette shortcut is ``check license``.

.. _admin_panel-update_assistant:

Update Assistant
""""""""""""""""

The **Update Assistant** updates OpenCelium to a newer version. If a new version
is found in the package cloud, it is announced here. The page has three steps:

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Step
     - Content
   * - **System Check**
     - Reviews the current health status of all system components and reminds
       you to back up before updating.
   * - **Available Updates**
     - Browse online (package cloud) or offline (uploaded) update packages.
   * - **Apply Update**
     - Executes the system update.

.. note::
   The page moved from ``/update_assistant`` to ``/update-assistant``. The old
   URL still redirects, so existing bookmarks keep working.

To follow the update in the log, see
:ref:`Logging <getting_started-administration-logging>`.

.. _admin_panel-system_check:

System Check
""""""""""""

New in 5.0. **License & System → System Check** displays the status and health
of the external services OpenCelium integrates with. It replaces the
*External Applications* card.

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Service
     - Description
   * - **OpenCelium**
     - The application itself.
   * - **MariaDB**
     - Stores users, groups, connectors, schedules and the remaining
       transactional data.
   * - **MongoDB**
     - Stores the workflow documents.
   * - **Email**
     - The mail server used for notifications and password resets.
   * - **Polyglot**
     - The ``polyglot-engine`` service for Python and Ruby enhancements.
   * - **Operating System**
     - Host-level information.

Each row reports a status — **Operational**, **Down**, or **Unknown** — plus an
info and an error column, so a failing component names its own reason.

The command palette shortcut is ``system check``.

.. _admin_panel-system_config:

System Configuration
""""""""""""""""""""

New in 5.0. **License & System → Configurations** edits the on-disk
``application.yml`` directly from the UI, so a configuration change no longer
requires shell access to the server.

.. warning::
   Changes are written to the file immediately but only take effect after the
   application has been **restarted**. The page shows a *Restart required*
   notice after a successful save.

How it works
============

* The file is presented as a **tree of configuration nodes**. Each node has a
  path, a value and a status.
* A node can be **enabled or disabled** with its checkbox. Disabling comments
  the line out on save, enabling uncomments it. The change **cascades**:
  disabling a section disables its contents, and enabling a nested key also
  enables the parent keys it needs. If disabling a key would leave a section
  without any active child, that section is commented out too.
* **Comments in the file are preserved.** Nodes whose YAML carries a comment
  show an info icon; hover it to read the comment. This is how the inline
  documentation of ``application_default.yml`` stays available in the UI.
* **Secrets are masked.** Passwords and tokens are not sent back to the browser
  in clear text — type a new value to replace them.
* **Search** filters the tree by field name; *Expand all* and *Collapse all*
  fold the tree.
* **Reset** discards your edits and reloads the configuration from the server.

Every write is backed up first. The backup location and retention are
themselves configured in ``application.yml``:

.. code-block:: yaml

   opencelium:
     config:
       file-path: ./application.yml
       backup:
         directory: runtime/backup/application
         keep: 10

Backups are written as ``<file>.bak.<epochMillis>`` and the newest ``keep``
copies per target file are retained.

Access
======

The page requires the **master password**, and the underlying endpoints
(``GET``/``PATCH /application-config``) require the ``Admin`` authority. If no
master password is configured, the page says so and asks an administrator to set
``opencelium.connector.master-password`` in ``application.yml`` and restart the
backend.

The command palette can read and edit single values with
``update system-config``.

UI
""

The top-level **UI** entry (``/ui/config``) holds the appearance settings of the
application, most notably the **theme**. The palette equivalent is ``ui theme``.
Themes are applied per user, and all pages — including published log and
dashboard views — follow the selected light or dark theme.
