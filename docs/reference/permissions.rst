.. _ref-permissions:

###########
Permissions
###########

Permissions are granted per **group** (the *Groups* page; the API and the command
palette call the entity ``role``). A group selects **components** and, per
component, the CRUD actions its members may perform.

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
   * - ``INVOKER``
     - Invokers.
   * - ``MYPROFILE``
     - The user's own profile.
   * - ``SCHEDULE``
     - Schedules.
   * - ``USER``
     - Users.
   * - ``USERGROUP``
     - Groups.

Actions are ``CREATE``, ``READ``, ``UPDATE`` and ``DELETE``. At least one
component permission is required per group.

How permissions show up in the interface
========================================

* Missing **READ** on a component hides its menu entry entirely.
* Missing ``CREATE``/``UPDATE``/``DELETE`` hides only those actions; the entry
  and its list stay visible.
* The command palette offers no commands for components you cannot read.
* ``/actuator`` and ``/application-config`` additionally require the ``Admin``
  authority.

Authentication
==============

Three mechanisms, described in :doc:`../guides/users-and-permissions`:

* **local** — credentials in MariaDB, hashed with BCrypt,
* **TOTP** — optional second factor per user,
* **LDAP** — bind authentication with group-to-role mapping, configured in
  :ref:`ref-configuration`.
