##################
Debug a workflow
##################

.. contents::
   :local:

Test run
========

From the editor header, start a **test run**. It executes the workflow in its
**current editor state** — no need to save first — and streams logs into the panel
at the bottom.

Constraints, all deliberate:

* one test at a time per workflow (``CONCURRENT_TEST_IS_FORBIDDEN`` otherwise),
* the run survives a page reload and is resumed when you return,
* leaving the editor asks for confirmation, then terminates the run,
* at least one step is required.

Read the log tree
=================

The tree mirrors the workflow. Expand a step to get its call:

* HTTP method, endpoint URL, status code and execution time,
* request and response headers,
* request and response body.

The copy icon puts a header, body or URL on the clipboard.

.. image:: ../img/schedule/OC5_execution-log-tree.png
   :align: center
   :width: 1000

Loop iterations are grouped, with a pager (``2 / 12``) that also jumps to a
specific index. Entries are marked ``ERROR``, ``WARNING`` or ``INFO``.

When a run fails the viewer takes you to the failure rather than making you hunt:
red trace dots, nested loops paged to the failing iteration, and the error shown on
the step instead of in the request/response section.

Panel controls: fullscreen, clear, minimise.

Historical runs
===============

Scheduled executions use the same viewer. In the schedule list, **Last Success**
and **Last Fail** carry a **see logs** link. It opens the *Execution Logs* dialog,
which first asks you to pick an execution from a drop-down — the retained runs of
that schedule — and then renders its tree.

.. note::
   Logs only exist for schedules with logging enabled (**Debug** column).
   Retention defaults to the 2 most recent successful and 3 most recent failed runs
   per workflow, configurable under ``log.retention.per-connection`` — see
   :ref:`ref-configuration`.

Errors before execution
=======================

Some problems are caught at save or test-start and reported against the node, which
is outlined in red:

.. list-table::
   :header-rows: 1
   :widths: 38 62

   * - Message
     - Cause
   * - ``OPERATOR_EXPRESSION_IS_EMPTY``
     - An ``If`` or ``Loop`` has no condition.
   * - ``CONNECTOR_NOT_FOUND``
     - A step references a deleted connector.
   * - ``CONCURRENT_TEST_IS_FORBIDDEN``
     - A test or schedule for this workflow is already running.

Field type mismatches during binding are reported as readable messages rather than
a stack trace.

Support bundles
===============

When you need support to look at a run, generate a **support bundle** from the
schedule's **Support logs** action. It runs the workflow, collects the logs, and
stores them with the invoker files as a ZIP.

Because logs contain real payloads, you choose what leaves your system:

.. list-table::
  :header-rows: 1
  :widths: 20 20 20 20 20

  * - Level
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
    - free
    - free
    - free
    - free

Or toggle each section individually with its eye icon. You are notified when
collection starts and again — over the WebSocket — when the file is ready.

Bundles are listed under **Configurations → Support Files**, where a green status
means a success archive exists and red means only a failure archive was produced.

If nothing streams
==================

An empty log panel and a dashboard reporting *Connection lost* both point at the
same thing: ``/ws`` is not proxied correctly. See
:doc:`../operations/troubleshooting`.
