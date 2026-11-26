.. _concept-connectors:

##############################
Connectors and API definitions
##############################

.. contents::
   :local:

These two are constantly confused, so it is worth being precise: an **API
definition** describes *how to talk to a kind of system*; a **connector** is *one
instance of such a system, with credentials*.

.. note::
   Up to 5.1 the interface called an API definition an **invoker**. The REST API,
   the command palette (``upload invoker``) and the folder on disk still use that
   name.

API definition
==============

An API definition is a definition file (XML) that describes an API:

* the **authentication type** — API key, token, basic, or endpoint
  authentication — and the fields required for it,
* the **operations** the API exposes: for each one an HTTP method, an endpoint
  path, request headers and body, and the shape of the success and error
  response,
* optionally a **pagination** description, so OpenCelium can fetch a paged
  result set as a whole (see :ref:`concept-pagination`).

One API definition is written once per product. `i-doit`, `CheckMK`, `OTRS` are
API definitions.

API definitions live in ``src/backend/src/main/resources/invoker``. The admin menu
lists them under **Configurations → API Definitions**. There are four ways to add
one:

* **create** it in the UI,
* **upload** a file — ``.xml``, or a ``.zip`` of several, up to 1 GB,
* **install** them from the online repository *(5.2)* — see below,
* **synchronise** them from the Service Portal (subscribers) — see
  :ref:`concept-invoker-sync`.

Install from the online repository
----------------------------------

.. note::
   **New in 5.2.**

The public repository `github.com/opencelium/invoker
<https://github.com/opencelium/invoker>`_ holds the API definitions maintained by
the OpenCelium team. Install them with the palette command
``install online-invokers`` (or the onboarding tour's **Install from online
repository**, shown when the Service Portal is not connected). Files already on the server are updated, new ones are added, and API
definitions that exist only on your server are kept. It needs the permission to
create API definitions, internet access from the server, and online services
switched on; the repository location is configurable — see
:ref:`ref-config-online-services`.

.. note::
   Editing an API definition file does **not** update the connectors and workflows that
   already use it. That is deliberate — an API definition change is not always wanted
   downstream. Synchronise explicitly when you want it to propagate.

.. _concept-invoker-sync:

Sync from the Service Portal
----------------------------

.. versionadded:: 5.3
   A sync of all API definitions on demand, ``PUT /invoker/sync``, and a button
   for it in the onboarding tour.

When your installation is connected to the Service Portal, the onboarding tour's
API definition step recommends **Sync from Service Portal** instead of the online
repository. It appears when online services are on,
``opencelium.online-services.invoker-sync.active`` is ``true`` and the server can
reach the Service Portal; otherwise the tour falls back to **Install from online
repository**. Outside the tour the sync runs on the schedule in
:ref:`ref-config-online-services`, or through ``PUT /invoker/sync``. There is no
sync button on the API definitions list.

How a sync treats your files:

* API definitions are matched **by their name**, not by file name. A known API
  definition is overwritten and keeps its local file name; an unknown one is
  added under the Service Portal's file name.
* A file that was **edited on disk**, outside OpenCelium, is skipped. Only a
  forced sync of that API definition (``PUT /invoker/{invokerName}/sync-force``,
  no button in the UI) overwrites it.
* An API definition that was created, uploaded or edited **through the UI or the
  API** is not protected: the next sync overwrites it with the Service Portal
  version.
* There is **no rollback**. If a sync fails halfway, the files written so far
  stay written; the error says so, and you can try again later.

Connector
=========

A connector is an API definition plus:

* a **title** and description,
* the **credentials** for one concrete system (the fields come from the
  API definition's authentication type). *(5.3)* A credential field can insert
  a :doc:`global variable <../guides/global-variables>` with the globe button
  **Insert a global variable** — only variables visible to **all** workflows
  are offered there,
* a **timeout** (default ``1000``) and an **SSL certificate** flag,
* optionally an icon, which is what you see on the canvas.

`Production CheckMK` and `Staging CheckMK` are two connectors over the same
CheckMK API definition. In a workflow, **Use Another Connector** on a step's
context menu (in its **Connector** submenu since 5.3) switches it between such
connectors without rebuilding it — see :doc:`../guides/build-a-workflow`.

The operations of an API definition fix each step's endpoint, but since 5.3 the
**HTTP method** of a connector step can be changed in the step's URL editor, as
for an HTTP request step — see :doc:`../guides/build-a-workflow`.

Duplicate a connector
---------------------

.. versionadded:: 5.3

The fastest way to the second of those connectors is the **Duplicate connector**
icon in the connector list. It opens the **Duplicate Connector** wizard pre-filled
from the original — title ``<title> (copy)``, description, API definition, timeout
and SSL flag. The **URL and the credentials are not copied**: enter them for the
new system, adjust anything else that differs, and save. The icon is not copied
either. Duplicating needs the permission to create connectors.

.. image:: ../img/connector/OC5_connector-duplicate.png
   :align: center
   :width: 900

Availability
============

A connector can be checked with a **connector test** (called *connection test* up
to 5.1): OpenCelium performs the API definition's test operation against the
connector's credentials. In the workflow editor the result appears as a status dot
on connector nodes and in the step drawer:

* **green** — the test passed,
* **orange** — the credentials were rejected,
* **red** — the system could not be reached, or the test failed for another
  reason; the tooltip carries it,
* **grey** — not tested yet,
* **locked** — the credentials need the master password.

From 5.2 an orange or red dot pulses. Hovering it shows a pencil that opens the
**Update Connector** wizard on its *Credentials* step, right from the canvas.

The point is to notice a broken target system while building, not in production.

Protecting credentials
======================

By default anyone who may read a connector can read its credentials. Setting a
**master password** changes that: credentials stay hidden until the password is
entered.

.. versionchanged:: 5.3
   The master password is kept only in memory. Enter it again after a page
   reload and after signing in again; up to 5.2 it was kept in the browser's
   storage.

The master password also gates two other things in 5.0: browsing a connector's
GraphQL schema, and the :doc:`../guides/configure-the-system` page.

Set it under ``opencelium.connector.master-password``. ASCII only.

.. _concept-pagination:

Pagination
==========

Some APIs return data page by page. Rather than modelling that in every
workflow, you describe it once in the API definition, in a ``pagination`` element at the
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
* :doc:`../guides/call-any-api` — when you do *not* want to write an API definition.
* :doc:`../reference/screens` — the connector screens field by field.
