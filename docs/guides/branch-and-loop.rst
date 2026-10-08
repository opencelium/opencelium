###################
Branch and loop
###################

.. contents::
   :local:

Conditional logic and repetition are both **logic blocks** (called *operators* up
to 5.1; the API still says ``operator``). One block holds as many conditions as
you need, combined with AND/OR and grouped, so you rarely need more than one.

Add a logic block
=================

Use the **+** handle on the step the block should follow, choose **Add Logic
Block**, then ``If`` or ``Loop``. Both selects are searchable.

* An ``If`` node has two outgoing paths, ``true`` and ``false``.
* A ``Loop`` node has a nested path for the repeated steps, and a continuation
  path for what comes after.

Mind which handle you use when adding steps afterwards: the nested path runs
*inside* the loop, the continuation path runs after it.

Define the condition
====================

Double-click the block, or right-click it → **Open Configuration**. The
condition builder opens.

.. image:: ../img/workflow/OC5_condition-builder.png
   :align: center
   :width: 1000

* **Add Condition** adds a row; **Add Group** adds a nested group.
* The **AND / OR** toggle joins the rows of a group.
* The copy icon on a row duplicates it, inserting the clone directly below.
* *(5.2)* In an ``If``, the **grip** at the left of a row or group header reorders
  it by drag and drop — before or after another row, or into another group by
  dropping it on that group's header. The grips appear once there are at least two
  rows or groups.
* Each side of a row takes its value from **Constant**, **Method** (an earlier
  step's *Body*, *Header* or *Status*) or **Webhook**.

Pick the comparison from the operator select — the full catalogue with arguments
and examples is in :doc:`../reference/operators`.

.. image:: ../img/workflow/OC5_if-reorder.png
   :align: center
   :width: 1000

Save the block to return to the canvas.

.. note::
   A logic block with no condition is refused on save with
   ``OPERATOR_EXPRESSION_IS_EMPTY``, and the node is outlined in red.

Loops
=====

A ``Loop`` uses one of three operators:

.. list-table::
   :header-rows: 1
   :widths: 18 40 42

   * - Operator
     - Iterates over
     - Arguments
   * - ``For``
     - the elements of an array
     - ``o1`` — the array
   * - ``ForIn``
     - the properties of an object
     - ``o1`` — the object
   * - ``SplitString``
     - the parts of a split string
     - ``o1`` — the string, ``o2`` — the delimiter

The loop exposes a **loop variable** (the iterator). The info panel beside the
condition shows it, with a description, its arguments and worked examples.

Using the iterator
------------------

Inside the loop, append the iterator to a reference so each pass reads its own
element. For iterator ``i`` and parameter ``result``:

* ``result[i]`` — the current element,
* ``result[1]`` — always the first element,
* ``result[*]`` — the whole array.

An empty array performs no iterations — that is not an error.

Nesting
=======

Operators nest freely: a loop inside a loop, an ``If`` inside a loop branch.
Deleting a logic block deletes everything nested inside it, so the confirmation
dialog is not a formality.

In the execution log, nested loop iterations are grouped and paginated, so you can
page to a specific iteration — see :doc:`debug-a-workflow`.

Skipping steps without a logic block
====================================

.. note::
   **New in 5.1.**

An ``If`` decides *per run* which path to take. When the decision is structural —
"once we are here, these three steps are not needed" — a **jump** says so
directly, as one line on the canvas, instead of a logic block around every step you
want to pass over.

Jumps point forward only and cannot cross a loop boundary, so they complement
logic blocks rather than replacing them. See :doc:`skip-steps-with-joints`.

Debugging a loop
================

Pausing a test run inside a loop lets you fast-forward to the next iteration, or
to a numbered one, instead of watching every pass. See :ref:`guide-debug-mode`.
