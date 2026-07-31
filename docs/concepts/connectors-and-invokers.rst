.. _concept-connectors:

########################
Connectors and invokers
########################

.. contents::
   :local:

These two are constantly confused, so it is worth being precise: an **invoker**
describes *how to talk to a kind of system*; a **connector** is *one instance of
such a system, with credentials*.

Invoker
=======

An invoker is a definition file (XML) that describes an API:

* the **authentication type** — API key, token, basic, or endpoint
  authentication — and the fields required for it,
* the **operations** the API exposes: for each one an HTTP method, an endpoint
  path, request headers and body, and the shape of the success and error
  response,
* optionally a **pagination** description, so OpenCelium can fetch a paged
  result set as a whole (see :ref:`concept-pagination`).

One invoker is written once per product. `i-doit`, `CheckMK`, `OTRS` are
invokers.

Invokers live in ``src/backend/src/main/resources/invoker`` and can be created
in the UI, uploaded as XML, or synchronised from the Service Portal.

.. note::
   Editing an invoker file does **not** update the connectors and workflows that
   already use it. That is deliberate — an invoker change is not always wanted
   downstream. Synchronise explicitly when you want it to propagate.

Connector
=========

A connector is an invoker plus:

* a **title** and description,
* the **credentials** for one concrete system (the fields come from the
  invoker's authentication type),
* a **timeout** (default ``1000``) and an **SSL certificate** flag,
* optionally an icon, which is what you see on the canvas.

`Production CheckMK` and `Staging CheckMK` are two connectors over the same
CheckMK invoker.

Availability
============

A connector can be health-checked: OpenCelium performs the invoker's test
operation against the connector's credentials. In the workflow editor the result
appears as a status dot on connector nodes and in the step drawer:

* **green** — the test passed,
* **red** — the test failed; the tooltip carries the reason,
* **grey** — the check is still running,
* **locked** — the credentials need the master password.

The point is to notice a broken target system while building, not in production.

Protecting credentials
======================

By default anyone who may read a connector can read its credentials. Setting a
**master password** changes that: credentials stay hidden until the password is
entered, once per browser session.

The master password also gates two other things in 5.0: browsing a connector's
GraphQL schema, and the :doc:`../guides/configure-the-system` page.

Set it under ``opencelium.connector.master-password``. ASCII only.

.. _concept-pagination:

Pagination
==========

Some APIs return data page by page. Rather than modelling that in every
workflow, you describe it once in the invoker, in a ``pagination`` element at the
same level as ``authType`` and ``operations``. OpenCelium then fetches all pages
and hands the workflow the complete result.

Parameters:

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Parameter
     - Meaning
   * - ``LINK``
     - URL that fetches the next page.
   * - ``SIZE``
     - Total number of elements.
   * - ``PAGE``
     - Page number. Incremented by one.
   * - ``LIMIT``
     - Number of elements to fetch at a time.
   * - ``OFFSET``
     - Starting point; incremented by ``LIMIT``.
   * - ``RESULT``
     - The array of elements in the response.
   * - ``HAS_MORE``
     - Signals that more elements remain.
   * - ``CURSOR``
     - Pointer to a specific record.
   * - ``ORDER``
     - Sequence of elements (``asc``, ``desc``).

Actions:

.. list-table::
   :header-rows: 1
   :widths: 18 82

   * - Action
     - Meaning
   * - ``READ``
     - Read the value from the given path in the reference.
   * - ``WRITE``
     - Place the parameter's value at the given path.
   * - ``INCREMENT``
     - Add, then increase. Used for ``OFFSET``.
   * - ``COLLECT``
     - Aggregate elements from all responses into one list. Used for ``RESULT``.
   * - ``FETCH``
     - Retrieve the next page. Used for ``LINK``.

Reference paths look like ``response.body.$.items``,
``request.url.$.limit``, ``response.header.$.next``.

Worked examples are in :doc:`../reference/operators` under
:ref:`ref-pagination-examples`.

Where to go next
================

* :doc:`../guides/build-a-workflow` — use a connector in a workflow.
* :doc:`../guides/call-any-api` — when you do *not* want to write an invoker.
* :doc:`../reference/screens` — the connector screens field by field.
