.. _ref-permissions:

###########
Permissions
###########

Permissions are granted per **role** (the *Roles* page, called *Groups* up to
5.1; the API and the command palette call the entity ``role``). A role selects
**components** and, per component, the CRUD actions its members may perform.

Components
==========

.. list-table::
   :header-rows: 1
   :widths: 22 78

   * - Component
     - Covers
   * - ``APP``
     - Application-wide administration, including System Configuration.
   * - ``CONNECTION``
     - Workflows. The component keeps its pre-5.0 name.
   * - ``CONNECTOR``
     - Connectors.
   * - ``DASHBOARD``
     - The dashboard.
   * - ``GLOBAL_VARIABLE``
     - *(5.3)* Global variables: the **Global Variables** page, its endpoints and
       its palette commands. Each variable adds its own grants on top — see
       below.
   * - ``INVOKER``
     - API definitions.
   * - ``MYPROFILE``
     - The user's own profile.
   * - ``SCHEDULE``
     - Schedules.
   * - ``USER``
     - Users.
   * - ``USERGROUP``
     - Roles.

Actions are ``CREATE``, ``READ``, ``UPDATE`` and ``DELETE``. At least one
component permission is required per role.

.. versionadded:: 5.3
   The ``GLOBAL_VARIABLE`` component. The ``Admin`` role is given all four
   actions on it; grant it to other roles as needed.

Per-variable grants
===================

.. versionadded:: 5.3

The ``GLOBAL_VARIABLE`` component opens the page and its actions. Which
variables a user may actually use, edit or delete is granted per variable, on the
**Sharing** step of the variable's details:

.. list-table::
   :header-rows: 1
   :widths: 22 78

   * - Grant
     - Allows
   * - **Use**
     - Viewing the variable and referencing it in workflows, connectors and
       notifications.
   * - **Edit**
     - Changing it (together with ``GLOBAL_VARIABLE`` ``UPDATE``). Includes
       *Use*.
   * - **Delete**
     - Deleting it (together with ``GLOBAL_VARIABLE`` ``DELETE``). Includes
       *Use*.

The creator (owner) and admins always hold all three and are the only ones who
can change the grants. The list shows only variables you may view, and saving a
workflow that references a variable you may not use is refused. See
:doc:`../guides/global-variables`.

How permissions show up in the interface
========================================

* Missing **READ** on a component hides its menu entry entirely.
* Missing ``CREATE``/``UPDATE``/``DELETE`` hides only those actions; the entry
  and its list stay visible.
* The command palette offers no commands for components you cannot read.
* *(5.3)* **Open in Playground** in the execution logs is shown only with
  ``CONNECTION`` ``UPDATE`` (and, in the editor, when the workflow is not
  read-only). See :doc:`../guides/request-playground`.
* ``/actuator`` and ``/application-config`` additionally require the ``Admin``
  authority.

Authentication
==============

Three mechanisms, described in :doc:`../guides/users-and-permissions`:

* **local** — credentials in MariaDB, hashed with BCrypt,
* **TOTP** — optional second factor per user,
* **LDAP** — bind authentication with group-to-role mapping, configured in
  :ref:`ref-configuration`.
