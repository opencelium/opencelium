.. _management-data_aggregator:

###############
Data Aggregator
###############

A **data aggregator** is a script that collects and transforms data across the
calls of a workflow, so the result can be used in a notification after the
workflow has been triggered (this happens in *Schedules*).

Managing aggregators
""""""""""""""""""""

Open the admin menu and go to **Configurations → Data Aggregator**. The list
shows the *name*, the *arguments* and the *archived* status of each aggregator.

The archived status marks aggregators that should be disabled and invisible in
the rest of the system. Click the status to switch it, and use the switcher above
the list to show archived aggregators.

Creating an aggregator
""""""""""""""""""""""

Aggregators are created on the **Data Aggregator** page, from the command palette
with ``create data-aggregator``, or directly from a workflow — the *Configure
Aggregator* dialog has a **Create new** button.

The wizard has two steps:

* **General Data** – the *name* and the *arguments*. The arguments are what you
  reference later in the notification template.
* **Script** – the aggregation logic. Assign the accumulated value to the
  arguments here. The editor offers autocomplete.

Using an aggregator
"""""""""""""""""""

**1. Assign it to a workflow step.** Open the workflow and either

* right-click the step and choose **Configure Aggregator**, or
* click the step's aggregator badge, which opens the same dialog.

In the dialog you select an existing aggregator or create a new one. A step with
an aggregator shows a badge whose tooltip reads *Combines results from multiple
calls using the "<name>" data aggregator*.

.. note::
   **Unassigning** an aggregator from a step only removes it from that step. The
   aggregator entry itself is kept and stays available for other steps.

**2. Reference its arguments in the notification template.** Go to
**Configurations → Notification Templates** and place the aggregator's arguments
into the *body* — the template form lets you click an argument to insert it.

**3. Create the notification.** Go to **Schedules**, open the *Notifications*
action of the schedule and create a notification with the **post** event type.

.. note::
   A data aggregator only takes effect for **post** notifications. The
   notification dialog states this as a hint.
