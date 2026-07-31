.. _concept-data-mapping:

############
Data mapping
############

.. contents::
   :local:

Steps are useless in isolation: the value of a workflow is that the output of one
call becomes the input of the next. That wiring is done with **references** and,
where a plain copy is not enough, **enhancements**.

References
==========

A reference takes a value from an earlier step's response and puts it into a
later step's request — into the URL, a header, or the body.

References point at a method **by colour**, not by name or position, so they
survive renaming and reordering. Internally a reference looks like
``#FFCFB5.(response).success.result[].id``: colour, section, path.

You never type that. The **reference generator** walks you through
*connector → method → field*.

Arrays and XML
--------------

* ``[*]`` references the whole array.
* ``[<index>]`` references one element, e.g. ``[1]`` for the first.
* Inside a loop, append the iterator to walk through it: for a loop with
  iterator ``i`` and parameter ``result``, use ``result[i]``.
* For XML responses, ``@`` offers the attributes of a tag.

Sources
-------

A reference can come from three places:

* **Method** — the response of an earlier step, as *Body*, *Header* or *Status*.
* **Constant** — a literal value.
* **Webhook** — a parameter of the webhook that started the workflow.

Direct references
=================

If a field holds a reference and nothing else, that is a **direct reference**: a
one-to-one copy with no code in between. The UI says so explicitly and shows the
two parameter paths.

Direct references execute faster than a scripted enhancement. Prefer them; only
reach for an enhancement when you actually need to transform the value.

Enhancements
============

An enhancement is a script that computes a target field from one or more
references. It runs during execution, per field.

The contract is fixed:

* the incoming references are ``VAR_0``, ``VAR_1``, … in order,
* the result must be assigned to ``RESULT_VAR``.

.. code-block:: javascript

   let result = VAR_0.toUpperCase();
   RESULT_VAR = result;

The **Variable Information** panel tells you, for each variable, which method and
field it comes from and where the result is used — worth reading before you
change someone else's script.

Deleting a reference replaces its variables in the script with
``OC_VAR_NOT_EXIST`` rather than silently shifting the others. Editing a
reference leaves the script alone.

Languages
---------

* **JavaScript** — runs inside the OpenCelium core on Nashorn
  (``org.openjdk.nashorn:nashorn-core 15.4``). The default, and the fastest.
* **Python 2**, **Python 3**, **Ruby** — run in the separate ``polyglot-engine``
  service, sandboxed.

.. code-block:: python

   result = VAR_0.upper()
   RESULT_VAR = result

.. code-block:: ruby

   result = VAR_0.upcase
   RESULT_VAR = result

The engine is a separate service you deploy yourself
(`opencelium/polyglot-engine <https://github.com/opencelium/polyglot-engine>`_)
and enable under ``opencelium.polyglot``. While it is disabled, enhancements run
on JavaScript; if it is enabled but unreachable, execution falls back to
JavaScript. Its reachability is reported on the System Check page.

.. warning::
   The configuration block belongs under ``opencelium:``, not at the top level of
   ``application.yml``. A top-level ``polyglot:`` block binds nothing and fails
   silently. See :doc:`../reference/configuration`.

Data aggregators
================

An enhancement shapes one field. A **data aggregator** collects data across the
calls of a whole workflow, so a notification can summarise the run.

An aggregator has a name, a set of **arguments**, and a script that assigns
values to those arguments. You attach it to a step, reference its arguments in a
notification template, and the values are filled in when the schedule sends the
notification.

.. note::
   A data aggregator only takes effect for **post** notifications — the ones sent
   after a run. Attaching it and then using a *pre* or *alert* notification will
   silently produce nothing.

Webhook parameters
==================

A workflow started by a webhook can read the webhook's query parameters (GET) or
payload (POST). Create parameters by name and type — ``Array``, ``Boolean``,
``Integer``, ``Number``, ``Object``, ``String``, ``Undefined`` — and reference
them like any other source.

In an endpoint they are written literally as ``${name:type}``, e.g.
``{url}/api/${methodName:string}``.

.. note::
   Do not confuse this with a **Trigger Workflow** step, which *calls* another
   workflow's webhook. Its response is only the trigger acknowledgement, never
   the result of the triggered workflow.

Where to go next
================

* :doc:`../guides/build-a-workflow` — wire two steps together.
* :doc:`execution` — when all of this actually runs.
