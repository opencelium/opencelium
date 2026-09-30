##################
Chain workflows
##################

A **Trigger Workflow** step starts another workflow's schedule through its
webhook.

Add it
======

Use a **+** handle, choose **Trigger Workflow**, then pick the workflow you want
to start. If it has several schedules you choose which one; if the schedule has no
webhook yet, OpenCelium offers to create one, and drops a predefined-URL HTTP node
into the canvas.

Workflows without a schedule cannot be triggered — the picker says so.

Understand the semantics before you rely on it
==============================================

.. warning::
   The call is **asynchronous**. The triggering workflow gets the webhook
   acknowledgement and continues immediately. It does **not** wait for the
   triggered workflow, and it cannot read its results. The node carries an
   *asynchronous* badge, and the reference picker states that its response is only
   the acknowledgement.

So this is a hand-off, not a function call.

When to chain, when not to
==========================

**Chain** when the second workflow is genuinely independent: a notification run, a
cleanup job, something whose outcome you do not need.

**Do not chain** when you need the second workflow's data, or when the two must
succeed or fail together. Since 5.0 a single workflow can call any number of
connectors in any order, so what used to require chained connections is now
usually one workflow — see :doc:`../concepts/workflow-model`. That version also
gives you real error handling and one log covering the whole flow.

Alternatives
============

* **One workflow** — the default answer.
* **Two schedules** on cron expressions, if the second merely has to run later.
* **A webhook called from outside** OpenCelium, if the trigger comes from another
  system — see :doc:`schedule-and-notify`.
