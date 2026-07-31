.. _concept-execution:

#########
Execution
#########

.. contents::
   :local:

A workflow runs in one of three ways: manually as a **test run** from the editor,
on a **schedule**, or because someone called a schedule's **webhook**. All three
use the same engine and produce the same logs.

What the engine does
====================

It walks the step tree in ``index`` order. For each step it builds the request —
substituting references and running enhancements — issues the call, stores the
response so later steps can reference it, and moves on.

Operators change the walk rather than issuing calls:

* an **If** operator evaluates its condition and continues down either the
  ``true`` or the ``false`` path,
* a **Loop** operator repeats its nested steps, exposing the current item as its
  iterator.

If an invoker declares pagination for the operation, the engine fetches all pages
before the step is considered finished, so the workflow sees one complete result.

Conditions and OCEL
===================

Operator conditions are stored as an **expression** and evaluated by the OCEL
expression processor. The condition builder in the UI writes that expression for
you; you never edit it as text.

An expression combines conditions with AND/OR and can be grouped arbitrarily
deep, so one operator handles cases that used to need several chained ones.

Each side of a condition is a constant, an earlier method's response, or a webhook
parameter, and the two sides are joined by one of the comparison operators
catalogued in :doc:`../reference/operators`.

Validation happens **before** execution. Saving or test-starting a workflow whose
operator has no expression is refused with ``OPERATOR_EXPRESSION_IS_EMPTY``, and
the editor outlines the offending node in red. Type mismatches during binding are
reported as readable errors rather than a stack trace.

Test runs
=========

A test run executes the workflow **in its current editor state** — you do not
have to save first. It exists to debug, so it is deliberately constrained:

* **one test at a time** per workflow; a second start is refused with
  ``CONCURRENT_TEST_IS_FORBIDDEN``,
* a run **survives a page reload** and is resumed when you come back,
* leaving the editor asks for confirmation and then terminates the run,
* the workflow needs at least one step.

Under the hood a test run creates a temporary connection and scheduler. Those are
cleaned up automatically; a background **sweeper** removes any that were left
behind by an interrupted run, and ``DELETE /connection/test`` does it on demand.
Test connections are excluded from the normal lists unless ``includeTest=true``
is passed.

Logs
====

Execution logs are a tree that mirrors the workflow: steps and operators nest,
loop iterations group together, and each call carries its HTTP method, URL,
status, duration, and request/response headers and body.

Logs stream to the browser over a WebSocket while the run is in progress, so a
test run gives immediate feedback. The same viewer shows historical scheduled
executions.

When a run fails, the viewer reveals the failure rather than making you hunt: the
trace dots turn red, nested loops page to the failing iteration, and the error is
shown on the step instead of in the request/response section.

.. note::
   Logs are only recorded for a schedule when logging is enabled for it (the
   **Debug** toggle). Retention is bounded — by default the two most recent
   successful and three most recent failed runs per workflow — and configurable
   under ``log.retention.per-connection``.

Support bundles
===============

When you need help from support, a **support bundle** packages a run's logs
together with the invoker files as a ZIP. Because logs contain real payloads, you
choose a masking level first — URL, headers, request and response can each be
masked independently, with Light/Medium/Strict presets.

Bundles are listed under Support Files, from where they can be downloaded or
deleted.

Chaining workflows
==================

A **Trigger Workflow** step starts another workflow's schedule via its webhook.
It is **asynchronous**: the calling workflow gets the webhook acknowledgement and
carries on immediately. It does not wait, and it cannot read the other
workflow's results.

If you need the result of the second workflow, do not chain — put the steps in
one workflow. Chaining is for fire-and-forget hand-offs.

Where to go next
================

* :doc:`../guides/debug-a-workflow` — read a failing run.
* :doc:`../guides/schedule-and-notify` — run it regularly and get told about it.
* :doc:`../reference/operators` — the operator catalogue.
