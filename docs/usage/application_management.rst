######################
Application Management
######################

.. contents::
   :local:

OpenCelium presents a unified interface across every module, so once you learn
the navigation the patterns repeat everywhere. 5.0 rebuilt the frontend on Ant
Design, with a unified iconography and a consistent list/wizard structure.

Layout
======

The application shell consists of:

* the **sidebar** on the left with the navigation,
* the **top bar** with the command palette and the global actions,
* the **content area**, and
* a **subscription alert** strip above the content when the license needs
  attention.

Sidebar
=======

The sidebar can be collapsed to icons and expanded again with the toggle at its
top; the tooltip states which action the button performs. Groups in the admin
menu expand and collapse individually.

There are **two menus**:

* the **main menu** – Dashboard, Connectors, Workflows, Schedules,
* the **admin menu** – Users & Access, Configurations, License & System, UI.

Switch between them with the menu switcher or with ``Alt+M``. The last page you
visited in a menu is restored when you switch back to it. Every leaf entry is a
real link, so ``Ctrl``/``⌘``/middle-click opens it in a new browser tab.

At the bottom of the sidebar you find **Sign Out**, which asks for confirmation.

Menu entries are filtered by permissions: an entry whose component you cannot
read is hidden entirely. Missing ``CREATE``/``UPDATE``/``DELETE`` permissions
only hide those specific actions.

Top bar
=======

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Element
     - Description
   * - **Create Workflow**
     - Jumps straight into a new workflow. Shortcut ``Alt+W``.
   * - **Command palette**
     - The central input. Type a command instead of navigating; see
       :doc:`command_palette`. Shortcut ``Ctrl+K`` / ``⌘+K``.
   * - **Language**
     - Toggles the interface between English and German.
   * - **Menu switcher**
     - Switches between the main and the admin menu (``Alt+M``).
   * - **Profile**
     - Opens the profile dialog. Only shown with ``MYPROFILE`` read permission.

.. note::
   The global search field of earlier versions has been replaced by the command
   palette, which searches entities, commands and the open workflow.

Messages and errors
===================

Actions such as create, update and delete produce a toast. Errors are reported
with the specific backend message where one exists — for example
``CONNECTOR_NOT_FOUND`` when saving a workflow whose connector was deleted, or
``CONCURRENT_TEST_IS_FORBIDDEN`` when a schedule is already running — instead of
a generic failure. Toast lifetimes are per-message, so longer explanations stay
readable.

Long-running background work reports over the WebSocket. Creating support logs,
for instance, first confirms that collection started and later notifies you that
the file is ready.

Screens are wrapped in scoped **error boundaries**. If one card or panel throws,
it shows a recoverable fallback and the rest of the page keeps working.

If a request is answered with ``401`` or ``403``, you are signed out
automatically, open dialogs are closed, and the route is remembered so you
return to it after signing in again.

A themed **404** page is shown for unknown routes inside the application shell.

Lists
=====

Data-heavy modules use one list engine, so they behave identically:

- a title and an explanatory subtitle at the top,
- a search field, whose placeholder names the fields it searches,
- sortable columns, some with percentage-based widths,
- per-row **view / update / delete** icons, each with a tooltip,
- row checkboxes that enable the bulk actions of the list,
- expandable **sub-rows** where a row has detail (for example the running
  executions of a schedule).

Destructive actions ask for confirmation. The confirm dialog focuses **Cancel**
by default and shows a loading state while the request runs, so a slow delete
cannot be triggered twice.

Wizards
=======

Create, update and view all use the same wizard:

- steps with their own header and subtitle,
- validation per step, so required fields stay highlighted until filled,
- conditional sections — for example, credential fields appear only after an
  invoker is chosen,
- step actions such as *Test connection*, which can gate the submit and ask you
  to confirm when the remote call failed,
- ``Ctrl+Enter`` to advance or submit, shown as a tooltip on Next/Submit,
- a success screen with recommended follow-up actions.

Wizards opened from the workflow editor's command palette skip the
recommendations, so you stay in your editing flow.

.. _usage-my_profile:

Profile
=======

The profile dialog has three sections:

- **User Details** – title, name, surname, department, organization, phone
  number, e-mail.
- **Update Password** – current password plus a new password that must contain an
  uppercase letter, a lowercase letter, a number and a special character, and be
  repeated identically.
- **Permissions** – the permissions your group grants you.

.. warning::
   Changing your password logs you out immediately; the dialog says so before
   you save.

Theme
=====

The theme is switched from the top bar and on the **UI** page, and it is stored
with your account. Both light and dark themes are supported throughout,
including the workflow canvas, dialogs and the log viewer.
