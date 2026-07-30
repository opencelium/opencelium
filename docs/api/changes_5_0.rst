.. _api-changes_5_0:

******************
API changes in 5.0
******************

.. contents::
   :local:

This page lists what changed in the REST API with OpenCelium 5.0. The complete,
always-current reference is the generated OpenAPI documentation linked from
:doc:`index` — this page only highlights the differences and the new payload
shape, so existing integrations can be checked quickly.

.. note::
   **The API keeps the name "connection".** The user interface calls the same
   object a *workflow*, but the endpoints, the DTOs and the fields
   (``/connection``, ``connectionId``) were deliberately left unchanged so
   existing clients keep working.

Workflow payload structure
==========================

This is the one breaking change in the data model.

Up to 4.8 a connection had two connector containers, ``fromConnector`` and
``toConnector``, and every method belonged to one of them.

Since 5.0:

* **all** methods and operators live under a single ``fromConnector`` container,
* that container has ``connectorId: -1`` and the title ``DEFAULT`` — it is a
  holder, not a real connector,
* ``toConnector`` is ``null``,
* every method carries its own connector reference and its type.

New fields on a method
----------------------

.. list-table::
   :header-rows: 1
   :widths: 25 20 55

   * - Field
     - Type
     - Description
   * - ``connector``
     - object
     - ``{ connectorId, title, invoker }`` — the connector this step calls.
       ``invoker`` is populated for templates, where ``connectorId`` cannot be
       resolved in another environment.
   * - ``methodType``
     - enum
     - ``CONNECTOR``, ``HTTP_REQUEST`` or ``WEBHOOK``.

``methodType`` values are a frozen contract: they are persisted in every method
document and hardcoded on the UI side.

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Value
     - Meaning
   * - ``CONNECTOR``
     - Calls an operation defined in the invoker of a connector.
   * - ``HTTP_REQUEST``
     - A free-form REST call with its own URL, headers and body — no invoker.
   * - ``WEBHOOK``
     - Triggers the schedule of another workflow through its webhook,
       asynchronously.
   * - ``null``
     - Legacy data. Keeps the pre-type behaviour: the invoker is inferred from
       the enclosing or own connector, falling back to a plain HTTP request.

Example
-------

.. code-block:: json

   {
     "connectionId": 42,
     "title": "idoit2CheckMK",
     "fromConnector": {
       "connectorId": -1,
       "title": "DEFAULT",
       "methods": [
         {
           "id": "…",
           "index": "0",
           "name": "getObjects",
           "methodType": "CONNECTOR",
           "connector": { "connectorId": 7, "title": "i-doit" },
           "request": { },
           "response": { }
         },
         {
           "id": "…",
           "index": "1",
           "name": "createHost",
           "methodType": "CONNECTOR",
           "connector": { "connectorId": 9, "title": "CheckMK" },
           "request": { },
           "response": { }
         }
       ],
       "operators": []
     },
     "toConnector": null,
     "fieldBinding": [ ]
   }

Reading documents written by older versions
-------------------------------------------

Documents stored by 4.x are converted to this shape **on the read path, in
memory**. The stored document is not modified until the workflow is saved again.
The conversion:

* stamps every method with the connector it originally belonged to,
* prefixes the indexes of the former *from* side with ``0_`` and those of the
  former *to* side with ``1_``, preserving the execution order,
* merges all methods and operators under one container,
* leaves ``fieldBinding`` untouched — bindings reference methods by colour code.

.. warning::
   A client that writes a workflow back in the new shape makes the stored
   document unreadable for a 4.x installation.

Operator expressions
====================

``OperatorDTO`` carries an ``expression`` (evaluated by the OCEL expression
processor) in addition to the legacy ``condition``. Saving an operator without an
expression is rejected with ``OPERATOR_EXPRESSION_IS_EMPTY``; the response names
the operator so a client can point at it.

New endpoints
=============

Application configuration
-------------------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Endpoint
     - Description
   * - ``GET /application-config``
     - Returns the current ``application.yml`` as JSON:
       ``{ fields, comments }``. ``fields`` is a tree of nodes
       (``key``, ``path``, ``status`` of ``active``/``inactive``, ``value``,
       ``comments``); ``comments`` holds the header/footer comments that belong
       to no field.
   * - ``PATCH /application-config``
     - Applies the ``fields`` array of the same envelope. Nodes are matched by
       ``path``: values are edited, new keys added, and nodes with status
       ``inactive`` are commented out. ``comments`` is read-only on write and
       ignored; comments on disk are preserved. **A restart is required for the
       change to take effect.**

Both require the ``Admin`` authority and answer ``403`` otherwise. A malformed
envelope — anything without a ``fields`` array — is rejected with ``400``.

Test connections
----------------

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Endpoint
     - Description
   * - ``DELETE /connection/test``
     - Permanently removes all leftover test connections. A test connection that
       is currently running is excluded. Returns a cleanup result.

Connector icons and health
--------------------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Endpoint
     - Description
   * - ``POST /connector/{id}/icon``
     - Uploads or replaces the icon of a connector
       (``multipart/form-data``).
   * - ``DELETE /connector/{id}/icon``
     - Deletes the icon of a connector.
   * - ``POST /connector/check``
     - Checks the connection to the remote application with the credentials set
       in the connector. Used by the workflow editor for its per-connector
       status dot.

.. note::
   ``POST /storage/connector`` still accepts a connector icon but is
   **deprecated** — use ``POST /connector/{id}/icon``.

Dashboard widgets
-----------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Endpoint
     - Description
   * - ``GET /widget/executions-timeline?days=7``
     - Executions and failures per day for the last ``days`` days, inclusive of
       today. Default ``7``.
   * - ``GET /widget/top-workflows?limit=5``
     - The connections with the highest all-time execution count, with their
       failure rate. Default ``5``.

Changed endpoints
=================

.. list-table::
   :header-rows: 1
   :widths: 35 65

   * - Endpoint
     - Change
   * - ``GET /connection/all``
     - New ``includeTest`` query parameter, default ``false``. Test connections
       are excluded unless it is ``true``.
   * - ``GET /connection/all/meta``
     - Same new ``includeTest`` parameter, default ``false``.
   * - ``GET /connection/dependency/{invokerName}``
     - Same new ``includeTest`` parameter.
   * - ``POST /connection/all/by-ids``
     - Same new ``includeTest`` parameter.
   * - ``GET /connection/check?name=<name>``
     - **New form** of the title-uniqueness check, taking the name as a query
       parameter so titles containing characters that are awkward in a path
       (spaces, slashes, apostrophes) work reliably.
   * - ``GET /connection/check/{name}``
     - **Deprecated.** Use ``GET /connection/check?name=<name>``.
   * - ``GET /template``, ``GET /template/{id}``
     - New ``metadataOnly`` query parameter, default ``false``. With ``true``
       only the template metadata is returned, without the full body — used by
       the template pickers to stay responsive.
   * - ``PUT /role/{id}/component``
     - Now transactional. A failure no longer leaves the role's permissions
       partially deleted.

Unchanged but worth knowing
===========================

The following existed before 5.0 and are the endpoints the new UI relies on
most:

* ``POST /connection/execution/test`` — starts a test run by temporarily creating
  a connection and a scheduler. Combined with ``DELETE /connection/test`` and the
  sweeper for cleanup.
* ``POST /connection/validate`` — validates the structure of a workflow. This is
  what produces the step-specific errors the editor highlights.
* ``GET /connection/{connectionId}/versions``,
  ``GET|DELETE|PUT /connection/{connectionId}/version/{snapshotId}``,
  ``PUT /connection/{connectionId}/switch-version/{snapshotId}`` — the version
  history behind the editor's *Version History* dialog.
* ``PATCH /connection/{connectionId}`` and the method/operator and fieldBinding
  patch endpoints — incremental saves.
* ``GET /connection/{connectionId}/rule/all`` and the ``rule`` endpoints — the
  masking rules used by the support-log bundles.
