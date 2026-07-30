#########
Schedules
#########

.. contents::
   :local:

A schedule defines **which workflow is executed when**. The *Schedules* page
shows all schedules and performs all CRUD actions on one screen.

Schedule List
"""""""""""""

The list shows the following columns:

.. list-table::
   :header-rows: 1
   :widths: 22 78

   * - Column
     - Content
   * - **Status**
     - A status circle. The number underneath it is a countdown to the next
       cron trigger.
   * - **Executions**
     - A collapsible cell with a live count badge of the currently running
       executions of this schedule.
   * - **Workflow**
     - The workflow this schedule runs.
   * - **Cron**
     - The cron expression. Click the chip or the edit icon to change it
       inline, see :ref:`scheduler_inline_cron`.
   * - **Last Success**
     - Date and time of the last successful run, linking to its log.
   * - **Last Fail**
     - Date and time of the last failed run, linking to its log.
   * - **Avg Duration**
     - The average duration of the runs.
   * - **Debug**
     - A toggle that activates or deactivates the logs for this schedule.
   * - **Webhook**
     - The webhook of this schedule, if one exists.

The status legend is:

* **Running** – an execution is currently in progress,
* **Last run succeeded**,
* **Last run failed**,
* **No cron and no run history**.

The search field filters by workflow name. Above the list you find the
categories; they are defined on the :ref:`Categories page
<admin_panel-categories>` and cannot be edited here, but all schedules can be
filtered by the category of their workflow.

Parallel executions
===================

Running executions are shown as **expandable sub-rows** underneath their
schedule, each with a progress ring, its start time and a live duration. If
nothing is running, the sub-row area shows *No running executions*.

The row actions are:

* **Start execution** – runs the schedule immediately.
* **Terminate execution** – cancels a running execution.
* **Webhook** – generate, copy or remove the webhook.
* **Notifications** – configure who is notified, see
  :ref:`scheduler_notifications`.
* **Support logs** – create a masked support bundle, see
  :ref:`scheduler_support_logs`.
* **Delete**.

Every action icon carries a tooltip.

.. note::
   Only one schedule per workflow can run at a time. Starting a second one is
   refused with *Another schedule for this connection is already running. Wait
   for it to finish before starting this one.*

.. _scheduler_inline_cron:

Editing the cron expression inline
==================================

The cron chip in the **Cron** column is clickable. It opens the *Edit Cron
Expression* dialog, which changes when the schedule runs without going through
the full update wizard. Saving reports the new expression in a confirmation
message.

Adding a new schedule
"""""""""""""""""""""

Click **Create** on the Schedules page — or use ``create schedule`` in the
command palette. The wizard asks for:

   * **title** (mandatory, the first step)
   * **workflow** (mandatory)
   * **logs** (optional, disabled by default)
   * **cron expression** (optional)

The *title* is displayed in the list and should be descriptive enough to
identify the schedule.

Activate the *logs* only if you need them; they are deactivated by default to
avoid unnecessary logging, and can be switched on later from the list.

Use the search field or the drop-down to select an existing *workflow*. The
description of each workflow is shown as well, to make identification easier.

``Ctrl+Enter`` advances to the next step and submits the last one.

.. note::
   A schedule can also be created directly from the workflow editor, scoped to
   the workflow you have open — see :ref:`usage-workflow-schedules`.

Cron Generator
""""""""""""""

The Cron Generator helps you build the most common cron expressions. Select the
desired values from the selection lists; below them you see a preview of the
next runs with the current settings. Confirm with **OK**.

The finished expression appears in the *Cron Expression* field. You can also
type an expression there directly; it is validated as you type.

A cron expression is a string of 6 or 7 fields separated by white space. The
first 6 fields are mandatory, the last is optional:

   * Second
   * Minute
   * Hour
   * Day of the month
   * Month
   * Day of the week
   * Year (optional)

OpenCelium uses the Quartz Job Scheduling Library for the cron jobs. On the
Quartz page you will find `examples`_ for the correct creation of cron
expressions.

.. _examples: https://www.quartz-scheduler.org/documentation/quartz-2.2.2/tutorials/crontrigger.html

**Examples:**

.. code-block::

   0 0 12 * * ?

**Meaning:** Run at 12pm (noon) every day

.. code-block::

   0 15 10 * * ? *

**Meaning:** Run at 10:15am every day

.. code-block::

   0 0/5 14,18 * * ?

**Meaning:** Run every 5 minutes starting at 2pm and ending at 2:55pm, AND fire
every 5 minutes starting at 6pm and ending at 6:55pm, every day

Webhook
"""""""

A *webhook* allows a workflow to be triggered by calling a URL. Create one per
schedule with the **Generate webhook URL** action; the **Webhook** column then
shows it.

* Clicking the copy icon puts the URL into the clipboard.
* The remove action deletes the webhook.

.. warning::
   Removing a webhook stops the URL from working immediately, and cannot be
   undone. A confirmation dialog asks before the webhook is removed.

Webhooks are also what the **Trigger Workflow** step of a workflow uses to start
another workflow — see :ref:`usage-workflow`. If the schedule you pick there has
no webhook yet, OpenCelium offers to create one for you.

.. _scheduler_notifications:

Notifications
"""""""""""""

*Notifications* inform you about certain events by e-mail or webhook. The
available event types are:

   * **pre** – triggered **before** the schedule runs,
   * **post** – triggered **after** the schedule ran,
   * **alert** – triggered in the **event of an error**.

.. note::
   The data aggregator only applies to **post** events.

.. note::
   Before you create a notification you need a template, described
   :ref:`here <management-notification_template>`.

Open the **Notifications** action of a schedule to see its notifications, add
one with **Add notification**, and delete one with its trash icon. Each
notification needs:

* **Name**
* **Event type** (pre / post / alert)
* **Notification type** (e-mail or webhook)
* **Template**
* **Recipients** — for the e-mail type, at least one recipient
* **Webhook URL** — for the webhook type

Bulk assignment
===============

To create the same notification for several schedules at once, select the
schedules with their checkboxes and use the **Notifications** bulk action. You
configure the notification once, and it is created for every selected schedule.
The result message reports how many schedules it was created for, and names how
many failed if some did.

.. _scheduler_execution_log:

Execution Logs
""""""""""""""

Each job includes a detailed **Execution Log** view. The log viewer is the same
interactive UI-log interface as the *Test Run* in the workflow editor, so
requests, loops and responses are inspected in a structured tree.

For each scheduled job the system keeps historical logs for both successful and
failed executions:

- **Success Logs:** the two most recent successful runs
- **Fail Logs:** the three most recent failed runs

The retention is configured in ``application.yml``:

.. code-block:: yaml

   log:
     retention:
       per-connection:
         success: 2
         fail: 3

Adjusting these values changes how many historical logs are stored per workflow
or scheduled job. Older logs exceeding the limits are removed automatically.

.. note::
   Logs are only created when they are activated for the respective job — the
   toggle in the **Debug** column must be on.

The entries in **Last Success** and **Last Fail** give direct access to the
corresponding logs: click the job number to open it in the log viewer. The three
dots give access to the logs of earlier jobs, if configured.

The viewer is the :ref:`UI log viewer <connection_ui_logger>` also used for the
test run.

.. _scheduler_support_logs:

Support Logs
""""""""""""

The **Support Logs** action creates a comprehensive log file for support, in case
a workflow is not working and you need help troubleshooting. It generates a
*masked* bundle, so you decide which parts leave your system.

In the upper area you select a preset for the degree of masking:

.. list-table::
  :width: 100 %
  :widths: 20 20 20 20 20
  :header-rows: 1

  * - Masking Level
    - URL
    - Headers
    - Request
    - Response

  * - **Light**
    - masked
    - visible
    - visible
    - visible

  * - **Medium**
    - masked
    - masked
    - visible
    - visible

  * - **Strict**
    - masked
    - masked
    - masked
    - visible

  * - **Custom**
    - free choice
    - free choice
    - free choice
    - free choice

Alternatively, toggle each section individually with its eye icon: the crossed-out
eye masks the section and makes it unrecognisable for support, the open eye
unmasks it again. The request and response are shown in a JSON viewer while you
decide.

Then click **Create Support-Logs**. The process starts the selected workflow,
generates the logs, and stores them together with the invoker files as a ZIP
file. You are notified when the collection starts and again — over the
WebSocket — as soon as the file is ready.

The generated support logs are reached either from the link in the notification
or under **Configurations → Support Files** in the admin menu.
