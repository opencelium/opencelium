.. _concept-workflow:

##################
The workflow model
##################

.. contents::
   :local:

A **workflow** is the unit of integration in OpenCelium. It is an ordered,
branching sequence of **steps**, and it is what you build in the workflow
editor.

Steps
=====

Every step makes one call. There are three kinds, and the kind is stored on the
step as its *method type*:

.. list-table::
   :header-rows: 1
   :widths: 22 20 58

   * - Step kind
     - Method type
     - What it does
   * - **Connector method**
     - ``CONNECTOR``
     - Calls an operation defined in the invoker of a connector. The usual case.
   * - **Simple HTTP request**
     - ``HTTP_REQUEST``
     - A free-form REST call: you pick the HTTP method and supply URL, headers
       and body. No invoker, no connector.
   * - **Trigger Workflow**
     - ``WEBHOOK``
     - Starts another workflow's schedule through its webhook. Asynchronous —
       this workflow does not wait for the other one to finish.

Two more node types control the flow rather than calling anything:

* **If** — branches into a ``true`` and a ``false`` path.
* **Loop** — repeats the steps nested inside it.

And every workflow begins at a **Start** node.

Every step carries its own connector
====================================

This is the defining property of the 5.0 model, and the thing most worth
internalising if you know earlier versions.

A step is not bound to a "side" of the integration. Each step names the
connector it calls. Consequences:

* A workflow can call **any number of connectors**, in any order, as often as
  you like — including the same connector repeatedly.
* Integrations have no fixed direction. Read from A, write to B, write the
  result back to A: one workflow.
* A step need not belong to a connector at all (see ``HTTP_REQUEST`` above).

.. note::
   **If you know 4.x.** A *connection* had exactly two connectors, a *from* and
   a *to*, and every method belonged to one of them. Reaching a third system
   meant splitting the integration across several connections chained by
   schedules. That restriction is gone. See :doc:`../start/upgrade-to-5`.

How it is stored
================

You do not need this to use the editor, only to work against the API.

All steps live under a single connector container — ``fromConnector`` with
``connectorId: -1`` and the title ``DEFAULT`` — and ``toConnector`` is ``null``.
Each method carries its own ``connector`` object plus its ``methodType``.

.. code-block:: json

   {
     "title": "idoit2CheckMK",
     "fromConnector": {
       "connectorId": -1,
       "title": "DEFAULT",
       "methods": [
         { "index": "0", "name": "getObjects",
           "methodType": "CONNECTOR",
           "connector": { "connectorId": 7, "title": "i-doit" } },
         { "index": "1", "name": "createHost",
           "methodType": "CONNECTOR",
           "connector": { "connectorId": 9, "title": "CheckMK" } }
       ],
       "operators": []
     },
     "toConnector": null,
     "fieldBinding": []
   }

The REST API and the Java packages still say *connection*: the endpoints are
``/connection``, the identifier is ``connectionId``, and the permission
component is ``CONNECTION``. Only the UI and this documentation say *workflow*.
See :doc:`../reference/api`.

Order of execution
==================

Steps carry an ``index`` that encodes their position in the tree. A plain
sequence is ``0``, ``1``, ``2``; nesting appends a segment, so a step inside the
first loop iteration is ``1_0``. Branch handles distinguish an ``If`` node's
``true`` path from its ``false`` path.

You never type these by hand — the editor maintains them as you drag steps
around. They matter when you read a stored document or a log.

Identity of a step
==================

Steps are identified in two different ways, and both show up in the UI:

* **Colour** — every method gets a generated colour. References between fields
  point at a method *by colour*, which is why a reference survives renaming and
  reordering. Steps that call the same method on the same connector share a
  colour and get a number badge.
* **Label** — an optional human-readable name you set yourself, so a canvas full
  of ``cmdb.category.read`` nodes stays readable.

Versions
========

Saving a workflow creates a **version**, with an author and a comment. Version
history is per workflow: you can open an older version, download it as a
template, or switch the active version back. Renaming a workflow or editing its
description saves automatically with a generated comment.

Where to go next
================

* :doc:`connectors-and-invokers` — what a step actually calls.
* :doc:`data-mapping` — how a value gets from one step into the next.
* :doc:`execution` — what happens when a workflow runs.
* :doc:`../guides/build-a-workflow` — build one.
