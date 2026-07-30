.. _usage-workflow:
.. _usage-connection:

#########
Workflows
#########

.. contents::
   :local:

.. note::
   **Renamed in 5.0.** What earlier versions called a *Connection* is now called a
   **Workflow**. The rename is not cosmetic — the underlying model changed, see
   :ref:`usage-workflow-model`. The REST API keeps its previous names
   (``/connection``, ``connectionId``) so existing integrations continue to work;
   only the user interface and the documentation use the new wording.

.. _usage-workflow-model:

From Connections to Workflows
"""""""""""""""""""""""""""""

Up to and including 4.8 a connection was bound to exactly **two** connectors: a
*from connector* (the source system) and a *to connector* (the target system).
Every method belonged to one of those two sides, and an integration that had to
touch a third system needed to be split into several connections chained by
schedules.

In 5.0 that restriction is gone. A workflow is a single, freely branching
sequence of steps, and **every step carries its own connector**. This means:

* A workflow can call **any number of connectors**, in any order, as often as
  needed — including calling the same connector several times.
* Integrations no longer have a fixed direction. Bidirectional and round-trip
  flows (read from A, write to B, write the result back to A) are expressed in
  one workflow.
* A step does not have to belong to a connector at all. Three step kinds exist:

  .. list-table::
     :header-rows: 1
     :widths: 20 25 55

     * - Step kind
       - Method type
       - Description
     * - Connector method
       - ``CONNECTOR``
       - Calls an operation that is defined in the invoker of a connector.
         This is the classic step and the one you use most.
     * - Simple HTTP request
       - ``HTTP_REQUEST``
       - A free-form REST call. You choose the HTTP method and supply URL,
         headers and body yourself — no invoker and no connector required.
         Use it for one-off endpoints you do not want to model as an invoker.
     * - Trigger Workflow
       - ``WEBHOOK``
       - Starts the schedule of *another* workflow through its webhook. The
         call is asynchronous: this workflow does not wait for the triggered
         workflow to finish.

Technically the steps of a workflow are stored under a single synthetic
connector container (``fromConnector`` with ``connectorId: -1``, ``toConnector``
is ``null``), and each method carries a ``connector`` reference plus its
``methodType``. You only need to know this when you work directly against the
:doc:`REST API <../api/connection>`.

.. _usage-workflow-migration:

What happens to workflows created before 5.0
============================================

Existing connections are **not rewritten in the database**. When 5.0 reads a
document that was stored by an older version, it converts it to the new layout
**in memory, on the read path only**:

* every method is stamped with the connector it originally belonged to,
* indexes of the former *from* side are prefixed with ``0_`` and those of the
  former *to* side with ``1_``, so the original execution order is preserved,
* all methods and operators are merged under one connector container,
* field bindings stay untouched — they reference methods by colour code.

The document on disk is only updated once you open the workflow and save it. As
a consequence you can update to 5.0, look at your existing workflows, and roll
back without having migrated any data. Templates are converted the same way.

.. warning::
   Once you save a pre-5.0 workflow in 5.0, the stored document uses the new
   layout and can no longer be read by a 4.x installation. Take a backup before
   you start editing (see :doc:`../gettinginvolved/administration`).

Workflow List
"""""""""""""

The workflow list is reached via **Workflows** in the main menu (the icon with
the branching arrows) and shows the *title* and the *description* of every
workflow.

Per row you can:

* **View / Update / Delete** – the three action icons at the end of a row. Each
  icon carries a tooltip.
* **Duplicate** – copies the workflow. A dialog asks for the new title and
  description; the title is checked for uniqueness while you type and defaults
  to ``<original title> (copy)``.
* **Download as template** – exports the workflow as a template JSON file
  without going through the editor.

Select several rows via their checkboxes to enable the bulk actions (for example
**Delete Selected**).

The search field above the list filters by title and description. Titles must be
unique; the check runs before an add or an update is performed and also when you
rename a workflow inside the editor.

Categories
==========

Categories group workflows and schedules and can be nested. In 5.0 they are
maintained on their own admin page, **Configurations → Categories**, rather than
from a category bar above the workflow list — see
:ref:`admin_panel-categories`.

.. note::
   The workflow list itself filters by *title* and *description* through its
   search field. The in-list category browser of earlier versions is not part of
   the rebuilt list.

.. warning::
    Deleting a category recursively removes all subcategories and the assigned
    workflows.

Workflow Editor
"""""""""""""""

Opening or creating a workflow leads to the workflow editor, which fills the
whole window (no application header). It has four areas:

* the **header** with title, description, actions and the command palette,
* the **canvas** in the middle, holding the workflow graph,
* the **sidebar**, which slides in when you add a step,
* the **logs panel** at the bottom, used by the test run.

The editor is reached at ``/workflow/create`` and ``/workflow/update/<id>``.
Press ``Alt+W`` anywhere in the application to create a new workflow.

Header
======

The header shows the **title** and the **description** of the workflow. Click
either to edit it inline; both are truncated with an ellipsis and reveal their
full text in a tooltip on hover. Committing a change auto-saves the workflow
with a generated version comment, so renaming never silently loses a version.

Next to them you find:

* the **schedules pill** – a status indicator plus a drawer with all schedules
  of this workflow (see :ref:`usage-workflow-schedules`),
* the **command palette** – collapsed to an icon with a hotkey pill, expanding
  when focused (see :doc:`command_palette`),
* the **test run** control (see :ref:`usage-workflow-testrun`),
* **Save** (also ``Ctrl+S``),
* the **header menu** with:

  .. list-table::
     :header-rows: 1
     :widths: 30 70

     * - Entry
       - Description
     * - Version History
       - All saved versions of this workflow, see
         :ref:`usage-workflow-history`.
     * - Download as Template
       - Downloads the current workflow as a template file. Disabled until the
         workflow has been saved once.
     * - Save as Template
       - Stores the workflow as a reusable workflow template.
     * - Load Template
       - Replaces the current graph with a template, see
         :ref:`usage-workflow-templates`.
     * - Shortcuts
       - Lists all canvas, node and general shortcuts.
     * - Exit
       - Leaves the editor.

If you leave the editor with unsaved changes — by closing the tab, reloading, or
navigating inside the application — a confirmation dialog appears.

Canvas
======

The canvas renders the workflow as a graph. Every step is a node, and the edges
define the order of execution.

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Action
     - Shortcut
   * - Pan the canvas
     - Drag
   * - Zoom in and out
     - Scroll, or the zoom controls on the canvas
   * - Open node configuration
     - Double-click
   * - Move a node
     - Drag the node
   * - Duplicate a node instead of moving it
     - ``Ctrl`` + drag
   * - Select multiple nodes
     - ``Ctrl`` + click
   * - Delete the selected node
     - ``Delete``
   * - Save the workflow
     - ``Ctrl+S``
   * - Close the open menu, dialog or panel
     - ``Esc``

Deleting a step asks for confirmation, because every step nested inside it is
removed as well.

Node types and badges
=====================

* **Start** – the entry point of the workflow.
* **Connector method** – a call defined by the connector's invoker. The node
  shows the connector icon and the method name.
* **Simple HTTP request** – a free-form request with its own HTTP method
  selector.
* **Trigger Workflow** – starts another workflow's schedule. Carries an
  **asynchronous** badge, because it does not wait for a response.
* **If** – branches the workflow into a ``true`` and a ``false`` path.
* **Loop** – repeats the nested step sequence.

Nodes can carry these badges:

* **Aggregator badge** – a data aggregator is assigned to this step. Clicking
  the badge opens the *Configure Aggregator* dialog.
* **Method colour badge** – nodes that call the same method on the same
  connector share a colour and a number, so duplicates are recognisable at a
  glance.
* **Error highlight** – if saving or starting a test run fails with a
  step-specific validation error (for example
  ``OPERATOR_EXPRESSION_IS_EMPTY`` or ``CONNECTOR_NOT_FOUND``), the offending
  node is outlined in red and the message is shown. The highlight clears on the
  next attempt or when you edit the node.

Connector availability status
=============================

New in 5.0: connector nodes and the method sidebar show a **live status dot**
for the connector, so you notice a broken connector while building the workflow
instead of in production. The status is determined once per connector via
``POST /connector/check``:

* **green** – the connection test passed, the connector is ready to use,
* **red** – the connection test failed; the tooltip shows the reason so you can
  fix credentials or settings,
* **grey / spinner** – the check is still running,
* **locked** – the connector's credentials require the master password.

Adding steps
""""""""""""

Hover a node and use the **+** handles on its right and bottom edge, or click
the *add step* trigger on an empty canvas. The sidebar opens with *Choose your
next step* and tells you where the step will be inserted
(*It will be added after: …*).

The sidebar offers:

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - Option
     - Description
   * - **Use Connector**
     - Browse the available API calls of a connector. First choose the
       connector, then the method. Both steps have a search field, show the
       connector icon and the invoker the methods come from.
   * - **Add HTTP Request**
     - Add a simple HTTP request and enter your URL. A selector sets the HTTP
       method.
   * - **Add Operator**
     - Add an ``If`` or a ``Loop`` operator.
   * - **Trigger Workflow**
     - Pick another workflow, then one of its schedules. If the schedule has no
       webhook yet, OpenCelium offers to create one; a predefined-URL HTTP node
       is then dropped into the canvas.

The search field at the top searches across connectors, operators and methods at
once. Empty states tell you explicitly when nothing matched, and load errors
suggest checking the backend connection.

Configuring a step
""""""""""""""""""

Double-click a node — or use its context menu — to configure it. The context
menu offers:

* **Change Label** – give the step a readable name of your own.
* **Open Configuration** – opens the request/response configuration.
* **Configure Aggregator** – assign, create or unassign a
  :ref:`data aggregator <admin_panel-data_aggregator>`. Unassigning only removes
  it from this step; the aggregator entry itself stays available for other
  steps.
* **Request → Edit URL / Edit Header / Edit Body**
* **Show Response** – opens the response definition (body, header, status).

Request URL
===========

The URL editor holds the endpoint of the step. For *Use Connector* nodes the
HTTP method is shown read-only (it comes from the invoker); for simple HTTP
requests you select it yourself.

References are inserted **directly in the URL field** in 5.0 — the separate
query-parameter editor of earlier versions has been removed. The reference
generator is opened from the field itself.

Body
====

The body dialog is split by a draggable splitter and groups its content into
collapsible sections: reference information, request data, enhancement and
description. Each section can be maximised on its own; the enhancement script
also opens in a separate window.

Three body formats are supported:

* **JSON** – a tree view in which you select a primitive field to inspect it and
  attach references. A field must hold either plain text *or* references —
  mixed values are rejected.
* **XML** – a tree view plus raw XML. Tags, text values and attributes are
  edited in dedicated dialogs.
* **GraphQL** – a GraphiQL-based query editor with schema autocomplete
  (``Ctrl+Space``). Static and dynamic token authentication strategies are
  supported. Only the query in the **active tab** runs when the step executes;
  tabs are named after the query's operation name, so anonymous queries stay
  ``<untitled>``.

  .. note::
     Browsing a connector's GraphQL schema requires the master password. If
     none is configured, set ``opencelium.connector.master-password`` in
     ``application.yml`` and restart the backend — or use the
     :ref:`System Configuration <admin_panel-system_config>` page.

References and Enhancements
"""""""""""""""""""""""""""

A **reference** takes a value from the response of an earlier step and uses it
in a later request. Open the reference generator from the field you want to fill
and pick *connector → method → field*. The method selects are searchable and
show the connector icon, its title and the method colour, so duplicated methods
stay distinguishable. Each select has a hover-reveal copy button.

For JSON arrays you can reference the whole array with ``[*]`` or a single
element with ``[arrayIndex]``. For XML you can reference a tag attribute by
typing ``@``, which offers the attributes of that tag.

Inside a loop, append the iterator to the reference to walk through it — for a
loop with iterator ``i`` and the parameter ``result`` this is ``result[i]``.
``result[1]`` takes only the first element.

Direct references
=================

If a field holds a reference but has no enhancement attached, the enhancement
pane shows a **Direct reference** panel with the left and right parameter paths.
A direct reference is a plain one-to-one mapping with no script in between and
executes faster than a scripted enhancement. Use **Create enhancement** to turn
it into a script; it is seeded with the default ``RESULT_VAR = VAR_0``.

Enhancements
============

An enhancement is a piece of code that runs while the workflow executes and
computes the value of a target field from one or more references. The predefined
variables are ``VAR_0``, ``VAR_1``, … for the incoming references and
``RESULT_VAR`` for the resulting value. The **Variable Information** section
explains for every variable where it comes from and where it is used.

Deleting a reference replaces all related variables in the script with
``OC_VAR_NOT_EXIST``; editing a reference no longer resets the script.

Supported languages
===================

* **JavaScript** – executed directly in the OpenCelium core
  (``org.openjdk.nashorn:nashorn-core 15.4``), the default and fastest option.
* **Python 2**, **Python 3**, **Ruby** – executed by the separate
  ``polyglot-engine`` service in a sandboxed environment.

.. code-block:: javascript

   let result = VAR_0.toUpperCase();
   RESULT_VAR = result;

.. code-block:: python

   result = VAR_0.upper()
   RESULT_VAR = result

.. code-block:: ruby

   result = VAR_0.upcase
   RESULT_VAR = result

Repository of the engine:
`opencelium/polyglot-engine <https://github.com/opencelium/polyglot-engine>`_

The engine must be reachable by the core. It is configured in the ``polyglot``
section of ``application.yml``:

.. code-block:: yaml

   polyglot:
     # Enables or disables the polyglot service integration. Default: false
     enabled: false
     # Communication protocol. Supported: grpc (default), http (future)
     protocol: grpc
     host: '127.0.0.1'
     port: 6566
     # Automatically start the polyglot service JAR if it is not running.
     auto-start: false
     launch:
       # Path to the polyglot service JAR. Required only if auto-start is true.
       jarPath:
       args:
       waitTimeoutSec: 30
       jvmArgs: '-Xms64m -Xmx256m'
       external-log-enabled: false

While ``polyglot.enabled`` is ``false``, enhancements run internally with the
JavaScript engine. If the service is enabled but unreachable, execution falls
back to JavaScript-only mode.

Webhooks in a workflow
""""""""""""""""""""""

A workflow can consume the query parameters (GET) or the payload (POST) of the
webhook that started it. Open the reference generator in a field and choose the
**Webhook** source. You then see the webhook parameters that already exist in
this workflow, and you can create a new one by name and type:

#. ``Array``
#. ``Boolean``
#. ``Integer``
#. ``Number``
#. ``Object``
#. ``String``
#. ``Undefined``

Webhook parameters can also be used on both sides of an ``If`` operator, and
they can be walked through inside a loop with ``[iterator]`` as described above.

In endpoints, webhook parameters are written as ``${[name]:[type]}``. For the
endpoint ``{url}/api/`` and a webhook parameter ``methodName`` of type
``string`` this is ``{url}/api/${methodName:string}``.

.. note::
   Do not confuse this with the **Trigger Workflow** step, which *calls* the
   webhook of another workflow. Its response is only the trigger
   acknowledgement, not the result of the triggered workflow — the reference
   picker states this explicitly.

Operators
"""""""""

Since 4.5 one operator can hold several conditions, combined with AND or OR, and
grouped for complex queries. 5.0 keeps that model and adds the OCEL expression
processor behind it: the condition you build in the UI is stored as an
expression on the operator and validated on the server. If an operator has no
condition, saving fails with ``OPERATOR_EXPRESSION_IS_EMPTY`` and the node is
highlighted.

Adding an operator
==================

Use the **+** handle of the node the operator should follow, choose **Add
Operator** in the sidebar and select ``If`` or ``Loop``. The operator selects
are searchable.

An ``If`` node has two outgoing paths, ``true`` and ``false``. A ``Loop`` node
has a nested path for the repeated steps and a continuation path.

Defining conditions
===================

Double-click the operator, or open its configuration from the context menu, to
get the condition builder (*IF Condition* / *LOOP Condition*). Use **Add
Condition** and **Add Group**, and combine the rows with AND or OR. Each row can
be duplicated with the copy button next to its delete icon; the duplicate is
inserted directly after the original.

Every side of a condition takes its value from one of three sources:

* **Constant** – a literal value,
* **Method** – the response of an earlier step, as *Body*, *Header* or
  *Status*,
* **Webhook** – a webhook parameter.

Loop operators
==============

A ``Loop`` operator exposes a **loop variable** (the iterator). The info panel
next to the condition documents the selected operator with its description,
arguments and examples, and shows the iterator reference you use inside the
loop.

.. list-table::
   :header-rows: 1
   :widths: 15 30 55

   * - Operator
     - Description
     - Arguments
   * - ``For``
     - Iterates through an array.
     - ``o1`` – an array to iterate through.
   * - ``ForIn``
     - Iterates through the properties of an object.
     - ``o1`` – an object whose properties should be iterated.
   * - ``SplitString``
     - Splits a string using a delimiter and iterates through the resulting
       array.
     - ``o1`` – a string to split, ``o2`` – a delimiter string.

Examples:

* ``For`` with ``o1 = ["a", "b", "c"]`` iterates through ``"a"``, ``"b"``,
  ``"c"``; with ``o1 = []`` it performs no iterations.
* ``ForIn`` with ``o1 = {"name":"Hob","age":123}`` iterates through the
  properties ``"name"`` and ``"age"``.
* ``SplitString`` with ``o1 = "a,b,c"`` and ``o2 = ","`` iterates through
  ``"a"``, ``"b"``, ``"c"``.

Possible IF operators
=====================

**1. Contains - “Contains”**

**Description:** Checks if a list contains a specific value.

**Arguments:**

- **`o1`**: A list of items to search within (can be `null` if `o2` is a valid list).
- **`o2`**: A single value or a list where the first element is the value to search for, and the second element is the list.

**Examples:**

- `o1 = ["apple", "banana", "cherry"], o2 = "banana"` → Returns `true`
- `o1 = null, o2 = ["banana", ["apple", "banana", "cherry"]]` → Returns `true`
- `o1 = ["apple", "banana"], o2 = "grape"` → Returns `false`

---

**2. ContainsSubStr - “ContainsSubStr”**

**Description:** Checks if any string in a list contains a specified substring.

**Arguments:**

- **`o1`**: A list of strings to search within (can be `null` if `o2` is a valid list).
- **`o2`**: A substring to search for or a list where the first element is the substring and the second element is the list.

**Examples:**

- `o1 = ["hello", "world", "java"], o2 = "wor"` → Returns `true`
- `o1 = null, o2 = ["wor", ["hello", "world", "java"]]` → Returns `true`
- `o1 = null, o2 = "wor"` → Throws `RuntimeException` (invalid input)
- `o1 = ["apple", "banana"], o2 = "pine"` → Returns `false`

---

**3. DenyList - “DenyList”**

**Description:** Ensures a value is not in a restricted list.

**Arguments:**

- **`o1`**: A value to check.
- **`o2`**: A list or string of restricted values.

**Examples:**

- `o1 = "guest", o2 = "admin,user,manager"` → Returns `true`
- `o1 = "admin", o2 = "admin,user,manager"` → Returns `false`

---

**4. EqualTo - “=”**

**Description:** Compares two values for equality.

**Arguments:**

- **`o1`**: First value to compare.
- **`o2`**: Second value to compare.

**Examples:**

- `o1 = "test", o2 = "test"` → Returns `true`
- `o1 = "test1", o2 = "test2"` → Returns `false`

---

**5. GreaterThan - “>”**

**Description:** Checks if the first numeric value is greater than the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 5, o2 = 3` → Returns `true`
- `o1 = 2, o2 = 5` → Returns `false`

---

**6. GreaterThanOrEqualTo - “>=”**

**Description:** Checks if the first numeric value is greater than or equal to the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 5, o2 = 5` → Returns `true`
- `o1 = 3, o2 = 5` → Returns `false`

---

**7. IsEmpty - “IsEmpty”**

**Description:** Verifies if a list is empty.

**Arguments:**

- **`o1`**: A list to check (cannot be `null`).
- **`o2`**: Ignored.

**Examples:**

- `o1 = [], o2 = null` → Returns `true`
- `o1 = [1, 2], o2 = null` → Returns `false`
- `o1 = null, o2 = null` → Throws `RuntimeException`

---

**8. IsNotEmpty - “NotEmpty”**

**Description:** Verifies if a list is not empty.

**Arguments:**

- **`o1`**: A list to check (cannot be `null`).
- **`o2`**: Ignored.

**Examples:**

- `o1 = [1, 2], o2 = null` → Returns `true`
- `o1 = [], o2 = null` → Returns `false`
- `o1 = null, o2 = null` → Throws `RuntimeException`

---

**9. IsNotNull - “NotNull”**

**Description:** Validates that an object is not null.

**Arguments:**

- **`o1`**: An object to check.
- **`o2`**: Ignored.

**Examples:**

- `o1 = "hello", o2 = null` → Returns `true`
- `o1 = null, o2 = null` → Returns `false`

---

**10. IsNull - “IsNull”**

**Description:** Validates that an object is null.

**Arguments:**

- **`o1`**: An object to check.
- **`o2`**: Ignored.

**Examples:**

- `o1 = null, o2 = null` → Returns `true`
- `o1 = "value", o2 = null` → Returns `false`

---

**11. IsTypeOf - “IsTypeOf”**

**Description:** Checks if an object is of a specific type.

**Arguments:**

- **`o1`**: An object to check.
- **`o2`**: A string representing the expected type.

**Examples:**

- `o1 = 123, o2 = "Integer"` → Returns `true`
- `o1 = "text", o2 = "Integer"` → Returns `false`

---

**12. LessThan - “<”**

**Description:** Checks if the first numeric value is less than the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 2, o2 = 5` → Returns `true`
- `o1 = 6, o2 = 5` → Returns `false`

---

**13. LessThanOrEqualTo - “<=”**

**Description:** Checks if the first numeric value is less than or equal to the second.

**Arguments:**

- **`o1`**: First numeric value.
- **`o2`**: Second numeric value.

**Examples:**

- `o1 = 5, o2 = 5` → Returns `true`
- `o1 = 7, o2 = 5` → Returns `false`

---

**14. Like - “Like”**

**Description:** Performs SQL-style "LIKE" pattern matching.

**Arguments:**

- **`o1`**: String to evaluate.
- **`o2`**: Pattern string (`%` is a wildcard).

**Examples:**

- `o1 = "hello", o2 = "h%o"` → Returns `true`
- `o1 = "hello", o2 = "h%z"` → Returns `false`

---

**15. Matches - “Matches”**

**Description:** Matches a string against a regular expression.

**Arguments:**

- **`o1`**: String to match.
- **`o2`**: Regular expression.

**Examples:**

- `o1 = "abc123", o2 = "\\w+\\d+"` → Returns `true`
- `o1 = "abc", o2 = "\\d+"` → Returns `false`

---

**16. MatchesInList - “AllowList”**

**Description:** Checks if a string matches any patterns in a list.

**Arguments:**

- **`o1`**: String to match.
- **`o2`**: A list of patterns or a single comma-separated string of patterns.

**Examples:**

- `o1 = "test1", o2 = "test1,test2,test3"` → Returns `true`
- `o1 = "test4", o2 = "test1,test2,test3"` → Returns `false`

---

**17. NotContains - “NotContains”**

**Description:** Validates that a value is not in a list.

**Arguments:**

- **`o1`**: A list to search within.
- **`o2`**: A value to check for.

**Examples:**

- `o1 = ["apple", "banana"], o2 = "cherry"` → Returns `true`
- `o1 = ["apple", "banana"], o2 = "apple"` → Returns `false`

---

**18. NotContainsSubStr - “NotContainsSubStr”**

**Description:** Validates that a substring is not found in any string in a list.

**Arguments:**

- **`o1`**: A list of strings to search within (can be `null` if `o2` is a valid list).
- **`o2`**: A substring to search for.

**Examples:**

- `o1 = ["hello", "world"], o2 = "java"` → Returns `true`
- `o1 = ["hello", "java"], o2 = "java"` → Returns `false`
- `o1 = null, o2 = ["java", ["hello", "world"]]` → Returns `true`

---

**19. NotEqualTo - “!=”**

**Description:** Validates that two values are not equal.

**Arguments:**

- **`o1`**: First value to compare.
- **`o2`**: Second value to compare.

**Examples:**

- `o1 = "test1", o2 = "test2"` → Returns `true`
- `o1 = "test1", o2 = "test1"` → Returns `false`

---

**20. NotLike - “NotLike”**

**Description:** Validates that a string does not match a "LIKE" pattern.

**Arguments:**

- **`o1`**: String to evaluate.
- **`o2`**: Pattern string (`%` is a wildcard).

**Examples:**

- `o1 = "hello", o2 = "h%o"` → Returns `false`
- `o1 = "hello", o2 = "h%z"` → Returns `true`

---

**21. PropertyExists - “PropertyExists”**

**Description:** Checks if a property (key or value) exists in a collection.

**Arguments:**

- **`o1`**: A map, list, or set.
- **`o2`**: A key or value to check for.

**Examples:**

- `o1 = {"key1": "value1"}, o2 = "key1"` → Returns `true`
- `o1 = ["apple", "banana"], o2 = "cherry"` → Returns `false`

---

**22. PropertyNotExists - “PropertyNotExists”**

**Description:** Validates that a property does not exist in a collection.

**Arguments:**

- **`o1`**: A map, list, or set.
- **`o2`**: A key or value to check for.

**Examples:**

- `o1 = {"key1": "value1"}, o2 = "key2"` → Returns `true`
- `o1 = {"key1": "value1"}, o2 = "key1"` → Returns `false`

---

**23. RegEx - “RegEx”**

**Description:** Matches a string against a regular expression.

**Arguments:**

- **`o1`**: Input string.
- **`o2`**: Regular expression.

**Examples:**

- `o1 = "123abc", o2 = "\\d+"` → Returns `true`
- `o1 = "abc", o2 = "\\d+"` → Returns `false`

Searching inside a workflow
"""""""""""""""""""""""""""

Large workflows are searched from the command palette in the editor header.
Type ``workflow`` to lock the palette to the workflow scope, then
``workflow search <term>``. The search is fuzzy (backed by Fuse.js) and
tolerates typos. It matches:

* method names, URLs, headers and query parameters,
* request and response bodies,
* the condition expressions of ``If`` and ``Loop`` operators.

Matching nodes are highlighted in yellow on the canvas. Highlights clear when
you leave the scope or press ``Esc``. See :doc:`command_palette` for the full
command reference.

.. _usage-workflow-testrun:

Test Run
""""""""

**Test Run** executes the workflow in its current editor state and streams the
runtime logs into the panel at the bottom. It is meant for debugging and
inspecting a workflow without going through a schedule or reading log files.

* Only **one test at a time** per workflow is allowed. Starting a second one is
  refused with a message.
* A running test **survives a page reload** — it is resumed when you come back,
  and you can stop it explicitly.
* Leaving the editor while a test runs asks for confirmation and then terminates
  the test.
* A test needs at least one method; otherwise the start is refused.
* Leftover test connections are removed automatically by a background sweeper,
  see :ref:`getting_started-administration-sweeper`.

When a test run fails, the log panel **reveals the failing element
automatically**: the trace dots turn red, nested loops are paged to the failing
iteration, and the error is shown in the method instead of the request/response
section. The failing method name is rendered in red.

.. _connection_ui_logger:

UI Log Structure
================

The layout of the log viewer is inspired by browser developer tools and presents
data in a structured, expandable tree view:

**1. Step hierarchy**

The workflow is displayed as a hierarchy representing the sequence of steps and
operators. Expand or collapse each level using the arrow icons.

**2. HTTP Requests and Responses**

Each API call is shown with:

* HTTP Method (e.g., POST, GET, DELETE, PUT)
* Endpoint URL
* HTTP Status Code (e.g., 200 OK, 201 Created, 204 Updated, 404 Not Found,
  401 Unauthorized, 500 Internal Server Error)
* Execution Time (in milliseconds)
* Request / Response Headers — metadata such as Content-Type or Authorization
* Request / Response Body (Payload) — the actual data sent and received

Header and body data can be copied to the clipboard with the copy icon.

**3. Loop Handling and Pagination**

If a step contains a loop, its iterations are grouped together. The pagination
control moves between individual iterations (e.g. 2 / 12), and you can jump
directly to an iteration by entering its index.

**4. Error and Warning Indicators**

Log entries are categorised by severity (``ERROR``, ``WARNING``, ``INFO``).
Click an entry to expand it and inspect the detailed request and response
information.

**5. Panel Controls**

The panel can be opened in fullscreen, minimised, and cleared; individual
headers, bodies and URLs are copied to the clipboard from their own icons.

Real-Time Streaming (WebSocket)
===============================

Log data is streamed to the frontend over a **WebSocket** connection, which
gives real-time feedback while a test run executes.

* Bidirectional WebSocket channel between client and backend
* JSON-based message format for all log events
* Incremental streaming in chunks to reduce network load
* Automatic reconnection on connection loss

.. note::
   The WebSocket is served under ``/ws``. When OpenCelium runs behind a reverse
   proxy, that path must be proxied with the ``Upgrade`` headers — the shipped
   ``conf/nginx_default.conf`` already does this.

Scalability and Performance
===========================

* Lazy-loading of log entries
* Collapsed view for repeated or looped steps
* Pagination when exceeding 500 log entries
* Asynchronous rendering pipeline in the frontend

Scheduler Integration
=====================

The same logging system is used for the :ref:`Scheduler <scheduler_execution_log>`,
so live test runs and historical scheduled executions share one format and one
viewer.

Log Format
==========

Each log event follows a defined JSON schema:

.. code-block:: json

   {
     "timestamp": "2025-10-27T10:45:32.521Z",
     "level": "INFO",
     "context": "connection.step.3",
     "message": "Request executed successfully",
     "duration_ms": 245,
     "request": {
       "method": "POST",
       "url": "https://api.example.com/items",
       "body": {}
     },
     "response": {
       "status": 200,
       "body": {}
     }
   }

.. _usage-workflow-schedules:

Schedules of a workflow
"""""""""""""""""""""""

The header shows a **schedules pill** whose colour aggregates the state of all
schedules of this workflow:

* a schedule is running,
* the last run failed,
* all schedules are healthy,
* no recent runs.

Clicking it opens a drawer with one card per schedule: status circle, next run,
collapsible details and a kebab menu with the row actions. **Add schedule**
creates a schedule scoped to this workflow.

.. note::
   Schedules can only be attached to a saved workflow. Until the first save the
   drawer says *Save the workflow to attach schedules*.

The full schedule management is described in :doc:`schedules`.

.. _usage-workflow-history:

Version History
"""""""""""""""

Every save creates a version. **Version History** in the header menu lists them
with author and comment. Per version you can:

* open it (with a warning if you have unsaved changes),
* edit its comment,
* copy its snapshot ID,
* download it as a template,
* delete it — the currently active version cannot be deleted.

Saving opens the **Save Version** dialog for a comment. Renaming the workflow or
changing its description saves automatically with a generated comment
(*Changing Workflow Name to …*) and skips the dialog.

.. _usage-workflow-templates:

Workflow Templates
""""""""""""""""""

A workflow template is a stored workflow configuration that is reused to create
new workflows quickly. Templates are managed under
**Configurations → Workflow Templates** and used from the editor header menu:

* **Save as Template** – stores the current workflow under a name.
* **Load Template** – replaces the current graph with the template.
* **Download as Template** / **Upload Template** – exchange templates between
  environments as JSON files. The Load Template dialog has an upload button.

.. warning::
   Loading a template replaces all current workflow changes. If the workflow
   already has a name and description, you are asked whether those should be
   replaced too; they are applied automatically only when both are still empty.

Mapping template connectors
===========================

Templates are usually created in another environment, where connector IDs mean
nothing. When a template's connectors cannot be resolved, the **Map template
connectors** dialog opens and asks which connector of *this* environment each
one should use. It lists the invoker hint and the methods that use each
connector, and lets you create a missing connector on the spot.

Pagination
""""""""""

Some APIs return data page by page. To make clear to the workflow how much data
it should handle, describe the pagination inside the invoker file. There is an
xml-tag on the same level as ``authType`` or ``operations`` — ``pagination``.

Pagination parameters:

#. ``LINK``     - contains url that fetches next data.
#. ``SIZE``     - total number of elements.
#. ``PAGE``     - refers to a page number. Will be incremented to one.
#. ``LIMIT``    - number of elements that should be fetched at a time
#. ``OFFSET``   - refers to the starting point from which data should be retrieved and incremented to LIMIT
#. ``RESULT``   - includes an array of elements retrieved from the response.
#. ``HAS_MORE`` - signifies that the array contains elements which require retrieval.
#. ``CURSOR``   - utilizes a pointer that refers to a specific database record.
#. ``ORDER``    - defines in which sequence elements are organised (asc, desc).

Parameter actions:

#. ``READ``      - Specifies that the value of the property should be retrieved from the specified path in the reference.
#. ``WRITE``     - Specifies that the value of the parameter should be placed at the specified path in the reference.
#. ``INCREMENT`` - Specifies that the value of the parameter should be added and then increased. Used for OFFSET
#. ``COLLECT``   - Specifies that elements from the responses should be aggregated into a single list. Used for RESULT
#. ``FETCH``     - Specifies the subsequent data to be retrieved. Used for LINK.

Parameter reference examples:

``response.body.$.param1.param2`` - points to a parameter in the RESPONSE BODY.
``request.body.$.param1.param2`` - points to a parameter in the REQUEST BODY.
``response.header.$.param1.`` - points to a parameter in the REQUEST HEADER.
``request.url.$.param1.param2`` - points to a nested parameter within the REQUEST URL.

EXAMPLES:

1. Example for OFFSET-LIMIT pagination:

Pagination:

.. code-block:: xml

        <pagination>
            <limit ref="request.url.$.limit" action="write">5</limit>
            <result ref="response.body.$.items" action="collect"/>
            <offset action="increment">0</offset>
            <size ref="response.body.$.total" action="read"/>
        </pagination>

Request:

.. code-block:: xml

        <request>
            <method>GET</method>
            <endpoint>{url}/offset/example?offset=@{offset}</endpoint>
            <body/>
            <header>
                <item name="Authorization" type="string">{basic}</item>
                <item name="Content-Type" type="string">application/json</item>
            </header>
        </request>

Response:

.. code-block:: xml

        <body type="object" format="json" data="raw">
            <field name="items" type="array">
                <field name="id" type="string"/>
                <field name="name" type="string"/>
                <field name="username" type="string"/>
            </field>
            <field name="nextCursor" type="string"/>
            <field name="nextLink" type="string"/>
            <field name="forin" type="string"/>
            <field name="total" type="string"/>
            <field name="offset" type="string"/>
            <field name="limit" type="string"/>
        </body>

2. Example for PAGE-BASED pagination:

Pagination:

.. code-block:: xml

        <pagination>
            <limit>5</limit>
            <result ref="response.body.$.content" action="collect"/>
            <page action="increment">0</page>
            <size ref="response.body.$.totalElements" action="read"/>
        </pagination>

Request:

.. code-block:: xml

         <request>
            <method>GET</method>
            <endpoint>{url}/page/example?size=@{limit}&amp;page=@{page}</endpoint>
            <body/>
            <header>
                <item name="Authorization" type="string">{basic}</item>
                <item name="Content-Type" type="string">application/json</item>
            </header>
        </request>

Response:

.. code-block:: xml

        <body type="object" format="json" data="raw">
            <field name="content" type="array">
                <field name="id" type="string"/>
                <field name="name" type="string"/>
                <field name="username" type="string"/>
            </field>
            <field name="totalElements" type="number"/>
        </body>

3. Example for CURSOR-BASED pagination with a LINK:

Pagination:

.. code-block:: xml

        <pagination>
            <limit>5</limit>
            <result ref="response.body.$.items" action="collect"/>
            <link ref="response.body.$.nextLink"/>
        </pagination>

Request:

.. code-block:: xml

        <request>
            <method>GET</method>
            <endpoint>{url}/cursor/example?size=@{limit}</endpoint>
            <body/>
            <header>
                <item name="Authorization" type="string">{basic}</item>
                <item name="Content-Type" type="string">application/json</item>
            </header>
        </request>

Response:

.. code-block:: xml

        <body type="object" format="json" data="raw">
            <field name="items" type="array">
                <field name="id" type="string"/>
                <field name="name" type="string"/>
                <field name="username" type="string"/>
            </field>
            <field name="nextCursor" type="string"/>
            <field name="nextLink" type="string"/>
            <field name="forin" type="string"/>
        </body>
