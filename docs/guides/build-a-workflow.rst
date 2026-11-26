##################
Build a workflow
##################

.. contents::
   :local:

Assumes you have connectors for the systems involved
(:doc:`../concepts/connectors-and-invokers`). For a guided end-to-end example
including the setup, see :doc:`../start/first-workflow` — or let the
:ref:`workflow tutorial <start-guided-tours>` walk you through one on the canvas.

Open the editor
===============

``Alt+W``, or **Create Workflow** in the top bar, or **Workflows → Create**. To
edit an existing one, use the pencil icon in the workflow list. The **Duplicate**
icon next to it copies a workflow in one click — see :ref:`guide-duplicate-workflow`.

The editor replaces the application header with its own; the navigation sidebar
stays. Five areas:

* the **header** — title, description, command palette, schedules pill, Save, and
  the header menu,
* the **canvas** — the graph, with the canvas controls at the top left,
* the **minimap** — bottom right, an overview of the whole workflow *(5.2)*,
* the **step drawer** — slides in from the right when you add a step,
* the **Execution Logs** panel — collapsed until a test run produces output.

.. image:: ../img/workflow/OC5_workflow-editor.png
   :align: center
   :width: 800

The canvas controls hold zoom in and out and, from 5.2, the two field-link
buttons — see :doc:`trace-field-links`.

Add steps
=========

Hover a node and use the **+** handle on its right or bottom edge. The drawer opens
with *Choose your next step* and tells you where the step will land.

.. image:: ../img/workflow/OC5_add-step-sidebar.png
   :align: center
   :width: 1000

.. list-table::
   :header-rows: 1
   :widths: 26 74

   * - Option
     - Use it for
   * - **Use Connector**
     - The normal case. Pick a connector, then one of its methods.
   * - **Add HTTP Request**
     - An endpoint you do not want to model as an API definition. See
       :doc:`call-any-api`.
   * - **Add Logic Block**
     - Branching (``If``) or repetition (``Loop``). See :doc:`branch-and-loop`.
       *(Called "Add Operator" up to 5.1.)*
   * - **Trigger Workflow**
     - Fire-and-forget another workflow. See :doc:`chain-workflows`.
   * - **Send Notification**
     - Post a message to Slack, Microsoft Teams or another incoming webhook.
       *(5.3)* See :doc:`send-notifications`.

The search box at the top searches connectors, logic blocks and methods at once.

Configure a step
================

Double-click a node, or right-click it for the context menu:

.. image:: ../img/workflow/OC5_node-context-menu.png
   :align: center
   :width: 360

.. versionchanged:: 5.3
   The context menu is grouped into sections, and the request editors share one
   row.

For a connector step the menu holds:

* **Request** — one row with three buttons, **URL**, **Header** and **Body**,
  each opening that part of the request editor.
* **Try Request…** — send this one request with test values and look at the
  response, without running the workflow. It calls the real API with the
  connector's credentials. See :doc:`request-playground`.
* **Show Response** — the response definition (body, header, status).
* **Change Label** — a readable name of your own.
* **Connector** — a submenu with:

  * **Use Another Connector** — move the step to another connector *(5.2)*, see
    below.
  * **Change Connector Image** — set the connector's logo from here *(5.2)*.
    This changes the connector itself, so every workflow using it shows the new
    image, and it needs the permission to update connectors.

* **Assign Data Aggregator…** — attach a data aggregator. Unassigning removes it
  from this step only; the aggregator itself stays available elsewhere.
* **Write to global variables** — after the step has responded, write values
  (for example a field of its response) into mutable global variables. See
  :doc:`global-variables`.
* **Copy** and **Paste** — see :ref:`guide-copy-between-workflows`.

The other step types show what applies to them. An HTTP request step has **Use
Another Connector** directly instead of the submenu. A Trigger Workflow step has
no **Try Request…**, because trying it would start the other workflow for real.
A Send Notification step has its own entries, see :doc:`send-notifications`. On
an IF or LOOP block the menu offers **Open Configuration**, **Assign Data
Aggregator…**, **Copy** and **Paste**; on the start node only **Paste**. Entries
you lack the permission for are left out, and the menu is not available while
the workflow is read-only or locked by a test run.

.. deprecated:: 5.3
   Removed in 5.3. Up to 5.2 the menu had a **Request** submenu with **Edit
   URL**, **Edit Header** and **Edit Body**, and **Use Another Connector** and
   **Change Connector Image** were top-level entries; use the **Request** row and
   the **Connector** submenu instead.

The HTTP method is set in the URL editor, for connector methods as well as for
HTTP requests.

.. versionchanged:: 5.3
   The HTTP method can now be changed for connector methods too. Up to 5.2 it was
   read-only there and came from the API definition.

References go directly into the URL field. The URL editor also lists the query
parameters in a table, where each parameter can be set to **Encode before
sending** or **Send as entered**.

Move a step to another connector
--------------------------------

.. note::
   **New in 5.2.**

**Use Another Connector** re-points the step at a different connector of the
**same API definition** — typically from a staging to a production system. The
method, request, references and transformations stay as they are; only the
connector, and with it the credentials, change.

.. image:: ../img/workflow/OC5_use-another-connector.png
   :align: center
   :width: 560

The list offers only connectors of the step's API definition; **Change** stays
disabled until you pick a different one. The change is recorded in the change
history and can be undone.

Map the data
============

Open **Body** on the receiving step. The body is a JSON tree (or XML, or GraphQL —
see :doc:`call-any-api`). Select a field, then insert a reference to an earlier
step's response.

.. image:: ../img/workflow/OC5_body-dialog.png
   :align: center
   :width: 1000

A field must hold either plain text **or** references — mixed values are
rejected.

Prefer plain references over scripts; only add a **transformation** (called
*enhancement* up to 5.1) where the value genuinely needs computing.
:doc:`../concepts/data-mapping` covers the rules, including arrays, loop iterators
and the ``VAR_0`` / ``RESULT_VAR`` contract. To see all links of a workflow at
once, use the field links lens — :doc:`trace-field-links`.

Read the canvas
===============

* **Colour + number badge** — steps sharing them call the same method on the same
  connector.
* **Aggregator badge** — a data aggregator is attached; click it to configure.
* **Comment badge** — the step has a note; click to show or hide it. *(5.1)*
* **Asynchronous badge** — a Trigger Workflow step, which does not wait.
* **Status dot** — the result of the connector test, see
  :doc:`../concepts/connectors-and-invokers`. From 5.2 a failing dot pulses;
  hovering it shows a pencil that opens the connector wizard on the
  *Credentials* step, so a rejected password can be fixed without leaving the
  editor.
* **Red outline** — a validation error from the last save or test start. It clears
  on the next attempt, when you edit the node, or with ``Esc``.
* **Problems badge** — in the header, next to **Save**. It counts the steps with
  errors or warnings found by the workflow check *(5.3)*; click it for the
  **Problems** panel. See :doc:`check-a-workflow`.
* **Green line** — a jump: this step continues at a later one, skipping what is
  between them. *(5.1)* See :doc:`skip-steps-with-joints`.

.. _guide-minimap:

The minimap
===========

.. note::
   **New in 5.2.**

The card in the bottom-right corner shows the whole workflow in miniature, with
the number of steps in its header.

.. image:: ../img/workflow/OC5_minimap.png
   :align: center
   :width: 320

* **Dots** are steps, coloured by connector (the legend names them, together
  with **HTTP request**, **Notification**, **Triggered workflow** and **Logic
  block**); logic blocks are diamonds, the start node a ring.
* The **rectangle** is what the canvas currently shows. Drag it to pan, or click
  anywhere on the map to jump there.
* **Rings** mark steps that need attention: amber when the step only has
  warnings, red otherwise. The pager below the map —
  *6 steps need attention* — steps through them with **‹** and **›**, left to
  right and top to bottom; the step name centres the canvas on it, and the
  chevron shows the error details.
* The **zoom** buttons and *Fit the workflow to the screen* sit at the bottom.

A step needs attention when the last save rejected it, the last test run failed
there, its connector test fails, one of its field links is broken, or it is an IF
or LOOP block without a condition. From 5.3 it also needs attention when a field
link reads a field the source method's response does not declare, or when a
reference path is not valid JsonPath.

.. versionchanged:: 5.3
   The minimap uses the same list of problems as the **Problems** panel (see
   :doc:`check-a-workflow`), plus failed test runs, and colours the rings by
   severity. The legend entry *System* is now called **HTTP request**, and
   **Notification** is new.

The chevron in the header collapses the card; the browser remembers that. While the
field links lens is on, its legend takes the minimap's place.

.. _guide-select-copy:

Select, move and copy several steps
===================================

.. note::
   **New in 5.2.**

.. list-table::
   :header-rows: 1
   :widths: 30 70

   * - Do
     - Effect
   * - ``Shift`` + drag on empty canvas
     - Selects every step inside the box.
   * - ``Ctrl`` + click a step
     - Adds it to the selection, or removes it.
   * - ``Ctrl`` + click an IF or LOOP
     - Selects the block together with everything in its scope. A block caught in
       a selection box brings its scope along too.
   * - Drag a selected step
     - Moves the whole selection.
   * - ``Ctrl`` + drag
     - Copies the selection instead of moving it.
   * - ``Ctrl+C``, then select a step and ``Ctrl+V``
     - Pastes the copies after that step. On an IF or LOOP you are asked whether
       to paste **In scope** or **After block**.
   * - ``Ctrl+D``
     - Duplicates the selected step next to it.
   * - ``Delete`` or ``Backspace``
     - Deletes the whole selection after one confirmation.

On macOS use ``⌘`` wherever ``Ctrl`` is written.

.. image:: ../img/workflow/OC5_multi-select.png
   :align: center
   :width: 1000

References between steps that are copied together are re-pointed to the copies,
and a jump is kept if its target was copied as well. If a move or copy would leave
a reference that cannot be read from its new place, a *Dependency conflict*
dialog tells you how many steps are affected before anything is cleared.

The node toolbar is hidden while more than one step is selected.

.. _guide-copy-between-workflows:

Copy steps to another workflow
------------------------------

.. versionadded:: 5.3

Copied steps can be pasted into a different workflow, also one open in another
browser tab.

#. Select the steps and press ``Ctrl+C``, or right-click and choose **Copy**.
   The message *3 steps copied* confirms it. An IF or LOOP block is copied with
   everything in its scope, and comment boxes attached to the steps come along.
#. Open the target workflow, select the step the copies should follow, and press
   ``Ctrl+V`` or choose **Paste** in its context menu. On the start node,
   **Paste** inserts the copies at the beginning. On an IF or LOOP you choose
   **In scope** or **After block**.

The copied steps are kept in the browser and also put on the system clipboard as
text. Copying works in read-only mode as well, so you can take steps out of a
workflow you may not change.

When the steps land in another workflow:

* **References between the copied steps** are re-pointed to the copies, as within
  one workflow.
* **Connectors** — each copied step moves to a connector of the same API
  definition that the target workflow already uses. If there are several, you
  choose one. If the target uses none, the step keeps its own connector. A step
  whose connector no longer exists cannot be pasted.
* **References to steps that were not copied** never silently point at an
  unrelated step. You choose a method of the target workflow to read from
  instead, or clear them.

If any of this needs a decision, the **Check pasted steps** dialog opens first:

.. image:: ../img/workflow/OC5_paste-check-dialog.png
   :align: center
   :width: 800

It lists the connector choices (*Choose a connector for …*), the steps that
cannot be pasted, and the outside references, with the same choices as when you
delete a step (:ref:`guide-delete-remap`). References you leave unmapped are
cleared. **Paste** inserts the steps — **Paste the rest** if some cannot be
pasted — and **Cancel** inserts nothing. If none of the steps can be pasted, the
dialog says so and offers only **Close**.

After pasting, references that cannot be read from the new place, such as a loop
iterator outside its loop, are cleared.

Limits:

* The start node cannot be copied.
* Pasting needs a selected target step, and is not available in read-only mode
  or during a test run.
* Within the same workflow, while the original steps are still on the canvas,
  pasting works as before and the dialog does not appear.

The node toolbar
================

.. note::
   **New in 5.1.**

Selecting a single node shows a small toolbar on it:

.. image:: ../img/workflow/OC5_node-toolbar.png
   :align: center
   :width: 620


.. list-table::
   :header-rows: 1
   :widths: 24 76

   * - Icon
     - Action
   * - **Link**
     - *Add jump* from this step to a later one. Disabled, with the reason in its
       tooltip, when no step can be the target. See :doc:`skip-steps-with-joints`.
   * - **Unlink**
     - *Remove jump* this step carries.
   * - **Comment**
     - Attach a note to this step. See :doc:`annotate-a-workflow`. The icon is
       gone once the step has one.
   * - **Delete**
     - Delete the step, and everything nested inside it. If other steps read from
       it, the confirmation lets you re-point those references — see
       :ref:`guide-delete-remap`.

Take back a change
==================

.. note::
   **New in 5.1.**

``Ctrl+Z`` undoes the last canvas change and ``Ctrl+Shift+Z`` (or ``Ctrl+Y``)
redoes it — covering node edits, request configuration, references, conditions
and edges, not just node placement. **Header menu → Change History** lists every
change of the session and jumps the canvas to any of them.

See :doc:`undo-and-history`, which also explains how this differs from Version
History.

Find things in a large workflow
===============================

``Ctrl+F`` *(5.2)* opens the command palette already scoped to the workflow, with
``search`` typed in — just type your term. (The long way still works: type
``workflow`` in the palette to lock the scope, then ``search <term>``.) The search
is fuzzy and matches method names, URLs, headers, query parameters, request and
response bodies, and operator conditions. Matches are highlighted yellow on the
canvas and the best one is centred; ``Esc`` clears them.

For a large workflow, the :ref:`minimap <guide-minimap>` is the other way around.

Edit everything at once
=======================

**Header menu → Edit as JSON** *(5.2)* opens the whole workflow as JSON, with live
validation. See :doc:`edit-as-json`.

Save
====

``Ctrl+S``, or **Save**. Each save creates a version and asks for a comment.
Leaving with unsaved changes asks for confirmation — including on tab close and
reload.

From 5.3 the workflow check runs first: errors refuse the save, and warnings ask
*Save with warnings?* before the comment. See :doc:`check-a-workflow`.

Link to a step
==============

.. versionadded:: 5.3

A link of the form ``/workflow/update/<id>?element=<index>`` opens the workflow
and selects the step with that ``index`` (see
:doc:`../concepts/workflow-model`). OpenCelium uses such links, for example in
the **Used by** list of a global variable. If the step no longer exists, a
message says *The linked step no longer exists in this workflow.*

.. _guide-duplicate-workflow:

Duplicate a workflow
====================

.. note::
   **New in 5.2.**

The **Duplicate** icon in the workflow list copies the workflow on the server
straight away — no dialog — and opens the copy in the editor. The copy is named
``<title> (copy)``, or ``(copy 1)``, ``(copy 2)`` … if that is taken; a notice
suggests giving it a proper title. Duplicating needs the permission to create
workflows.

Where to go next
================

* :doc:`debug-a-workflow` — run it and read the logs.
* :doc:`check-a-workflow` — the Problems panel.
* :doc:`send-notifications` — post to Slack or Teams from a workflow.
* :doc:`trace-field-links` — see which step reads which field.
* :doc:`skip-steps-with-joints` — skip steps without a logic block.
* :doc:`annotate-a-workflow` — leave notes for whoever opens it next.
* :doc:`undo-and-history` — undo, change history, version history.
* :doc:`schedule-and-notify` — run it regularly.
* :doc:`reuse-with-templates` — reuse it elsewhere.
