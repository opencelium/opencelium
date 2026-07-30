.. _usage-command_palette:

################
Command Palette
################

.. contents::
   :local:

New in 5.0, the **command palette** is a global command interface. Instead of
navigating through menus, you type what you want to do and OpenCelium executes
it — opening a list, creating an entity, updating a value, downloading a
template, or searching the workflow you have open.

Opening the palette
"""""""""""""""""""

* Press ``Ctrl+K`` (``⌘+K`` on macOS) anywhere in the application.
* In the workflow editor the palette is embedded in the header as a collapsed
  icon with a hotkey pill. It expands when focused and switches to modal mode.

The footer of the palette shows the available keys: **Select**,
**Autocomplete**, **Navigate** and **Close**. ``Esc`` closes the palette; if the
palette is locked to a scope, ``Esc`` on an empty input leaves that scope first.

.. note::
   The palette respects your permissions. Commands for components you may not
   read are not offered.

How commands are built
""""""""""""""""""""""

Commands read like short sentences and are completed step by step. As you type,
the palette proposes the next word, so you rarely type a full command.

The general shape is::

   <verb> <entity> [by <field> <value>]

Every entity supports up to five verbs:

.. list-table::
   :header-rows: 1
   :widths: 20 35 45

   * - Verb
     - Example
     - Description
   * - ``open``
     - ``open users``
     - Opens the entry list of the entity.
   * - ``create``
     - ``create user``
     - Opens the create wizard.
   * - ``find``
     - ``find user by email jane@example.com``
     - Opens an entry in view mode.
   * - ``update``
     - ``update schedule by id 12``
     - Opens an entry in update mode.
   * - ``delete``
     - ``delete connector by title Jira``
     - Deletes an entry after a confirmation.

The ``by <field> <value>`` part accepts the identifiers that make sense for the
entity — an ID, a title, a name, or an e-mail address. Values are resolved
against a live, cached list, so the palette can complete existing names for you.

Suggestions are grouped into **Workflow**, **Recent**, **Navigate**,
**Create**, **Manage**, **System** and **General**. If a typed command resolves
to nothing, the palette says *No results found* instead of showing an empty
dropdown.

Wizards opened from the palette in the workflow editor suppress the
recommendation tags on their success screen, so you stay in your editing flow.

System commands
"""""""""""""""

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Command
     - Description
   * - ``check license``
     - Check license and API operation usage.
   * - ``system check``
     - Open the system check page, see
       :ref:`admin_panel-system_check`.
   * - ``check ldap``
     - Open the LDAP connectivity check page.
   * - ``update system-config``
     - Update the on-disk application configuration, see
       :ref:`admin_panel-system_config`. Requires the master password; the
       palette tells you when none is configured.
   * - ``system ui`` / ``ui theme``
     - Change the application theme.
   * - ``upload workflow-template`` / ``download workflow-template by templateId <id>`` / ``download workflow-template by name <name>``
     - Exchange workflow template files.
   * - ``upload invoker`` / ``download invoker by name <name>``
     - Exchange invoker files.
   * - ``list workflow-templates`` / ``list invokers``
     - Open the respective lists.
   * - ``help`` (aliases ``commands``, ``?``)
     - Open the command reference dialog.

The command reference
"""""""""""""""""""""

``help`` opens **Command reference** — *Everything you can do from the command
palette*. The dialog is generated from the live command tree, so it always
matches the commands your installation and your permissions actually offer. It
has its own search field and lists the palette's keyboard shortcuts.

Workflow scope
""""""""""""""

Inside the workflow editor the palette has a pinned **Workflow** section. Typing
``workflow`` locks the palette to that scope (shown as a chip), from where
``workflow search <term>`` performs a fuzzy search across the open workflow.
See :ref:`usage-workflow` for what exactly is searched and how matches are
highlighted.

Global hotkeys
""""""""""""""

.. list-table::
   :header-rows: 1
   :widths: 20 80

   * - Shortcut
     - Action
   * - ``Ctrl+K`` / ``⌘+K``
     - Open the command palette.
   * - ``Alt+M``
     - Toggle between the main menu and the admin menu.
   * - ``Alt+W``
     - Create a new workflow.
   * - ``Ctrl+Enter``
     - Advance or submit the current step in an entity wizard.
   * - ``Ctrl+S``
     - Save the workflow (in the workflow editor).
