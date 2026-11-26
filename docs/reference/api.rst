.. _ref-api:

########
REST API
########

.. contents::
   :local:

The generated OpenAPI reference is the authoritative, always-current source:

- `Swagger <../swagger.html>`_
- `ReDoc <../redoc.html>`_
- `Spotlight Elements <../spotlight.html>`_
- `RapiDoc <../rapidoc.html>`_

A live installation also serves the interactive browser under ``/docs``.

The rest of this page covers what changed with 5.0 and since, so an existing
integration can be checked quickly. The 5.3 changes come first, in
:ref:`ref-api-5-3`.


.. note::
   **The API keeps the name "connection".** The user interface calls the same
   object a *workflow*, but the endpoints, the DTOs and the fields
   (``/connection``, ``connectionId``) were deliberately left unchanged so
   existing clients keep working.

.. _ref-api-5-3:

Changes in 5.3
==============

.. versionadded:: 5.3

No endpoint was removed in 5.3. The additions and changed behaviour are listed
below; the OpenAPI reference has the full request and response schemas.

Global variables
----------------

Base path ``/global-variable``. Every endpoint needs the matching permission on
the ``GLOBAL_VARIABLE`` component, and reading or changing a single variable
also needs the per-variable grant (*view and use*, *edit* or *delete*) — the
owner and admins hold all of them. See :doc:`../guides/global-variables`.

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Endpoint
     - Description
   * - ``GET /global-variable/all``
     - Paged list of the variables you may view. Parameters ``page``, ``size``
       (at most 100), ``sort`` (``name``, ``kind``, ``createdAt`` or
       ``updatedAt``), ``search``, ``kind``.
   * - ``GET /global-variable/{id}``
     - One variable.
   * - ``GET /global-variable/unique/{name}``
     - ``{"result": true}`` if the name is still free.
   * - ``POST /global-variable``
     - Creates a variable. ``400`` with the violations when it is invalid.
   * - ``PUT /global-variable/{id}``
     - Updates a variable. The body must carry the current ``version``;
       ``409`` on a conflict, and also when the change would rename the variable,
       narrow its scope or change script parameters while it is in use.
   * - ``DELETE /global-variable/{id}``
     - Deletes a variable. ``204``; ``409`` while it is still in use.
   * - ``GET /global-variable/picker``
     - The variables usable in one place. At most one of ``connectionId``,
       ``categoryId``, ``connectorId`` or ``schedulerId``; connectors only get
       variables visible to all workflows.
   * - ``GET /global-variable/values``
     - Current values, by ``ids`` (at most 100) or ``workflowId``. Supports
       ``ETag``/``304``. Script variables are not included.
   * - ``POST /global-variable/{id}/impact``
     - Preview of what a planned change or deletion would block.
   * - ``POST /global-variable/{id}/restore/{changeId}``
     - Restores a change-log entry. Body ``{"version": …}``. Secret values
       cannot be restored.
   * - ``POST /global-variable/{id}/reset``
     - Resets a mutable variable to its initial value.
   * - ``POST /global-variable/validate-script``
     - Test-runs a script; returns ``valid``, ``result``, ``resultJsonType``,
       ``durationMs`` and ``error``.
   * - ``GET /global-variable/{id}/usage``
     - Where the variable is used (workflows, connectors, notifications).
   * - ``GET|PUT /global-variable/{id}/permissions``
     - Reads or sets the per-variable grants. Writing needs the owner or an
       admin.
   * - ``GET /global-variable/{id}/changes``
     - Change log, newest first, paged with ``page`` and ``size``.

Create and update body:

.. code-block:: json

   {
     "name": "apiBaseUrl",
     "kind": "CONSTANT",
     "description": "…",
     "value": "https://api.example.com",
     "secret": false,
     "scope": { "type": "ALL", "categoryIds": [], "workflowIds": [] },
     "busyPolicy": "QUEUE",
     "ownerWorkflowIds": [12],
     "version": 3,
     "script": {
       "language": "js",
       "code": "return a + b;",
       "parameters": [ { "name": "a", "required": true }, { "name": "b", "required": false, "default": 1 } ]
     }
   }

``kind`` is ``CONSTANT``, ``MUTABLE`` or ``SCRIPT``; ``scope.type`` is ``ALL``,
``CATEGORIES`` or ``WORKFLOWS``; ``busyPolicy`` is ``QUEUE`` or ``REFUSE``;
``script.language`` is ``js``, ``python3`` or ``ruby``. Only the fields of the
chosen kind apply: ``secret`` only for constants, ``busyPolicy`` and
``ownerWorkflowIds`` only for mutable variables, ``script`` only for scripts.

Single requests, references and scripts
---------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Endpoint
     - Description
   * - ``POST /connection/method/test/refs``
     - Lists the dynamic values of one method (connector values, references,
       global variables) for the :doc:`Request Playground
       <../guides/request-playground>`. Sends nothing.
   * - ``POST /connection/method/test``
     - Sends one method **to the real API** with the connector's credentials.
       Body ``{ method, staticValues, confirmWrite }``. Anything other than
       ``GET``, ``HEAD`` or ``OPTIONS`` needs ``confirmWrite: true``, otherwise
       ``400 METHOD_TEST_WRITE_NOT_CONFIRMED``. Nothing is saved or logged.
   * - ``POST /connection/method/curl``
     - Builds the same request as a cURL command without sending it. The
       connector's authentication may still run. The command contains real,
       unmasked connector credentials and tokens — only secret global variables
       are masked — so treat the response as a secret.
   * - ``POST /connection/reference/validate``
     - Checks the syntax of a reference and compares it with the method's
       example response.
   * - ``POST /lang-code/validate``
     - Syntax check of a transformation script.
   * - ``POST /lang-code/execute``
     - Runs a JavaScript transformation on the server for the :doc:`Script
       Playground <../guides/script-playground>`. Calls no external system.
       ``429 TOO_MANY_SCRIPT_RUNS`` when too many runs are active — see
       :ref:`ref-config-code-only`.

The three ``/connection/method/*`` endpoints accept ``connectionId`` or
``categoryId`` as query parameter, not both (``400
METHOD_TEST_WORKFLOW_AMBIGUOUS``).

Users and API definitions
-------------------------

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Endpoint
     - Description
   * - ``GET /user/check/username/{username}``
     - Whether a username is already taken. Returns a ``ResultDTO`` with a
       boolean.
   * - ``POST /user/{id}/password-link?sendEmail=false``
     - Admin only. Creates a one-time set-password link and returns
       ``{ link, expiresAt }`` with ``Cache-Control: no-store``. With
       ``sendEmail=true`` the link is also emailed. Earlier links of that user
       stop working. Errors: ``400 PASSWORD_MANAGED_EXTERNALLY`` (LDAP user),
       ``400 EMAIL_NOT_FOUND`` (``sendEmail`` without an email), ``404
       USER_NOT_EXIST``, ``503 EMAIL_RECOVERY_FAILED`` (mail failed, no link
       created).
   * - ``PUT /invoker/sync``
     - Syncs all API definitions from the Service Portal. ``204``, or ``200``
       with ``{"result": "…"}`` when online services are switched off. See
       :ref:`concept-invoker-sync`.

Changed behaviour
-----------------

.. list-table::
   :header-rows: 1
   :widths: 35 65

   * - Endpoint
     - Change
   * - ``POST /login``
     - The body takes the account in ``identifier``, ``username`` or the
       legacy ``email`` key — the first non-blank one wins — plus ``password``.
       Repeated failures are answered with ``429`` and a ``Retry-After`` header
       (see :ref:`ref-config-code-only`); a wrong password still answers
       ``403``.
   * - ``POST /user``, ``PUT /user/{id}``
     - ``email`` and ``username`` are both optional, but one is required.
       New ``400`` codes ``EMAIL_OR_USERNAME_REQUIRED``,
       ``USERNAME_ALREADY_EXIST`` and ``USERNAME_INVALID`` (a username of an
       OpenCelium account may not contain ``@``).
   * - ``POST /storage/profilePicture``
     - Takes ``userId``; the legacy ``email`` parameter still works.
   * - Saving a workflow or a category
     - A title that is already in use answers ``409`` with
       ``TITLE_HAS_ALREADY_TAKEN`` instead of ``500``.
   * - ``GET /scheduler/execute/{schedulerId}``, ``PUT /scheduler/startAll``,
       ``GET|POST /webhook/execute/{token}``
     - Answer ``409`` with code ``BUSY`` when the workflow is already running,
       uses a mutable global variable and that variable's busy policy refuses a
       second start.
   * - ``POST /connection/remoteapi``
     - ``sslOn: true`` now means *trust any certificate*, matching the
       connector setting; it was inverted before.
   * - ``POST /storage/invoker``
     - A file uploaded as ``Name.XML`` is stored as ``Name.xml``. Re-uploading
       an existing API definition under a differently cased file name now
       overwrites it.

Text responses
--------------

A step that expects JSON but receives a successful answer that is not JSON —
Slack's ``ok``, for example — now gets it **as text, with its real status and
headers**. Up to 5.2 this became a ``500`` *Client error*. JSON answers are
parsed whatever their content type.

String values inserted from references and global variables are escaped in JSON
and XML bodies. A text body without a charset is declared and sent as UTF-8
(it was ISO-8859-1).

URL encoding
------------

How a method's URL is encoded before it is sent:

* **Typed text is sent as written.** An existing ``%XX`` stays as it is; only
  characters that are not allowed in a URL are encoded (a space becomes
  ``%20``, ``Müller`` becomes ``M%C3%BCller``, a lone ``%`` becomes ``%25``).
  To send a literal ``%20``, type ``%2520``.
* ``/ ? & = # +`` in typed text are URL structure. Encode them yourself when they
  are data.
* ``[`` and ``]`` are encoded only in the path; they are kept in the query
  (``?filter[name]=x``) and in an IPv6 host.
* **Values from references are encoded as data.** In the query ``& = + # %``
  are encoded; in the path ``/`` stays a separator.
* Inserted as raw URL text, without data encoding: a reference at the very start
  of the URL (for example a full URL from another method), connector values such
  as ``{url}`` and ``{host}``, and a query part that consists only of a
  reference.
* The order of query parameters and duplicate keys are kept; ``q=`` and a bare
  ``?flag`` are accepted.

In the URL editor, **Encode before sending** on a query parameter escapes only
``&``, ``=`` and ``#``.

.. note::
   A URL that relied on the earlier behaviour — for example pre-encoded
   reference values, or values containing ``&`` — may now be sent differently.
   Check such methods with the :doc:`Request Playground
   <../guides/request-playground>` after updating.

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
     - Calls an operation defined in the API definition of a connector.
   * - ``HTTP_REQUEST``
     - A free-form REST call with its own URL, headers and body — no API definition.
   * - ``WEBHOOK``
     - Triggers the schedule of another workflow through its webhook,
       asynchronously.
   * - ``null``
     - Legacy data. Keeps the pre-type behaviour: the API definition is inferred from
       the enclosing or own connector, falling back to a plain HTTP request.

Jumps (5.1)
------------

A method may carry a **jump**: after it runs, execution continues at another
method instead of at the next one.

.. list-table::
   :header-rows: 1
   :widths: 25 20 55

   * - Field
     - Type
     - Description
   * - ``jump``
     - string
     - The ``index`` of the target method. Absent when the method has no jump.
       A method carries at most one.

The server validates every jump on save and again before execution, rejecting
it with one of the ``JUMP_*`` codes listed in
:doc:`../guides/debug-a-workflow`. The rules — methods only, forward only, same
loop scope, may leave an ``If`` but not enter one — are described in
:doc:`../guides/skip-steps-with-joints`.

.. note::
   The field was named ``jumpTo`` in pre-release builds and documents using the
   old name are still read, but new documents should be written with ``jump``.

Global variable writes (5.3)
----------------------------

A method may write values to mutable :doc:`global variables
<../guides/global-variables>` after it runs.

.. list-table::
   :header-rows: 1
   :widths: 25 20 55

   * - Field
     - Type
     - Description
   * - ``globalWrites``
     - object
     - A map from target to value, for example
       ``{ "global.lastSync": "<value or reference>" }``. Each key must have
       the form ``global.<name>``. Absent when the method writes nothing.

The target must be a mutable variable, and the workflow must be one of its
owner workflows; otherwise saving is refused with ``NOT_MUTABLE`` or
``NOT_OWNER``. References to global variables elsewhere in a workflow use the
form ``{{global.name}}``.

Canvas annotations (5.1)
------------------------

**Comment boxes** are stored in the workflow's ``ui`` object, alongside node
positions, not among the methods. Each records its text, its anchor node, its
offset from that node, its size and whether it is minimised. They are ignored by
the execution engine and are carried along by templates.

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
   * - ``GET /template/all``, ``GET /template/{id}``
     - New ``metadataOnly`` query parameter, default ``false``. With ``true``
       only the template metadata is returned, without the full body — used by
       the template pickers to stay responsive.
   * - ``PUT /role/{id}/component``
     - Now transactional. A failure no longer leaves the role's permissions
       partially deleted.

Deprecated
==========

These still work but should not be used in new integrations. They are marked
``deprecated`` in the OpenAPI spec:

.. list-table::
   :header-rows: 1
   :widths: 45 55

   * - Endpoint
     - Use instead
   * - ``GET /connection/check/{name}``
     - ``GET /connection/check?name=<name>``
   * - ``POST /storage/connector``
     - ``POST /connector/{id}/icon``
   * - ``GET /template/all/{fromConnectorId}/{toConnectorId}``
     - ``GET /template/all`` — looking templates up by a *pair* of connectors no
       longer matches the data model, because a workflow is not bound to two
       connectors. Filter the list instead, or let the
       *Map template connectors* flow resolve them.

Removed
=======

.. list-table::
   :header-rows: 1
   :widths: 45 55

   * - Endpoint
     - Note
   * - ``POST /assistant/db/migrate``
     - The Neo4j-to-MongoDB migration. Run it while still on the 4.x line; see
       :doc:`../operations/updating`.
   * - ``GET /connection/execution/{executionId}``,
       ``GET /execution/log/{executionId}/flowchart/{flowId}``,
       ``GET /execution/log/{executionId}/meta/list``
     - Replaced by the new log structure:
       ``GET /execution/logs/children``,
       ``GET /execution/log/element/{elementId}/children``,
       ``GET /execution/log/element/{elementId}/details``,
       ``GET /execution/{executionId}/raw/log`` and ``GET /execution/log-files``.

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
