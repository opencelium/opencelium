.. _guide-joints:

#####################
Skip steps with jumps
#####################

.. contents::
   :local:

.. note::
   **New in 5.1.** Up to 5.1 the interface called this element a **joint**; 5.2
   renamed it to **jump**. Nothing changed in how it works or how it is stored.

A **jump** connects one step directly to a later step. When the engine reaches
the source step, it runs it and then continues at the jump's target — every step
in between is skipped.

Before 5.1 the only way to pass over a step was to wrap it in an ``If`` block
and invert the condition, which meant a logic block per skipped step and a canvas
that no longer read like the process it described. A jump expresses the same
thing as one line on the canvas.

Add a jump
===========

#. Select the method the jump should start from.
#. In the node toolbar that appears, click the **link** icon (*Add jump*). If no
   step could be a target, the icon is disabled and its tooltip says why: *a
   target must run later, in the same loop scope*.
#. The canvas enters target-picking mode. A bar at the top of the canvas says what
   to do and offers **Cancel**; legal targets are highlighted, and hovering an
   illegal one explains why it cannot be used.
#. Click the target.

.. image:: ../img/workflow/OC5_jump-picking-bar.png
   :align: center
   :width: 1000

.. image:: ../img/workflow/OC5_joint-picking.png
   :align: center
   :width: 1000

*Target-picking mode.* The source is ringed blue; the two methods that may
receive the jump are ringed green. The steps inside the loop, the logic blocks and
the Start node are not candidates and stay unmarked.

``Esc`` or **Cancel** in the bar leaves target-picking mode without creating
anything. Clicking an illegal target does not end it — you can try again.

The jump is drawn as a green line with an arrow head, using the same geometry as
every other edge. Hover it to reveal a delete button at its midpoint, or select
the source node again and use the **unlink** icon in its toolbar.

.. image:: ../img/workflow/OC5_joint-edge.png
   :align: center
   :width: 1000

*The finished jump.* The green line leaves ``getFolderList`` and runs past
``getAllFolders`` and the loop straight into the second ``getAllFolders``: when
the jump is taken, everything it passes is skipped. Because a sequence is laid
out on one row, the jump follows the same line as the edges it overtakes.

A method carries **at most one** jump. To point it somewhere else, remove the
existing one first.

.. note::
   Removing a jump can invalidate references. If steps downstream read data from
   methods that only run because of this jump, the confirmation dialog says how
   many are affected — those references are cleared when you confirm.

What is a legal target
======================

The editor and the server enforce the same rules, so a jump that the canvas
accepts is a jump that will save and run.

.. list-table::
   :header-rows: 1
   :widths: 34 66

   * - Rule
     - Why
   * - Both ends must be **methods**
     - An ``If`` or ``Loop`` block can be neither the source nor the target of
       a jump. Aim at the method inside the branch instead.
   * - The target must run **after** the source
     - A jump points forward only. It is a skip, not a goto — there are no
       backwards jumps and therefore no accidental infinite loops.
   * - Both ends must share a **loop scope**
     - Either both outside every loop, or both inside the very same one. A loop
       is a ceiling in both directions: a step inside it cannot jump out, and
       nothing outside can jump in.
   * - A jump may **leave** an ``If``, but not **enter** one
     - A step may escape outward through the conditions enclosing it, up to that
       loop ceiling. Landing inside a branch it is not part of would run a step
       whose guarding condition was never evaluated.

Hovering an illegal target outlines it in red and names the rule it breaks:

.. image:: ../img/workflow/OC5_joint-invalid.png
   :align: center
   :width: 1000

The full set of messages:

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Message
     - Meaning
   * - *Only a method can be the target of a jump.*
     - You aimed at a logic block or the Start node.
   * - *A jump can only point forward, to a method that runs after the selected
       one.*
     - The target runs before the source, or is the source itself.
   * - *The target must be a method in the same loop scope as the selected one —
       both outside every loop, or both inside the same loop.*
     - One end is inside a loop the other is not in.
   * - *A jump cannot enter a condition the selected method is not itself
       inside. It may leave the conditions around it, but not enter another one.*
     - The target sits in an ``If`` branch the source does not belong to.
   * - *This jump would skip …, whose response this method uses.*
     - The target reads data from a step the jump would skip. See below.

References across a jump
=========================

The editor refuses a jump that would skip a method whose response the target
consumes, because the result is almost never what you wanted: the step runs
without the data it was written against.

The engine is more forgiving than the editor here. If such a situation arises
anyway — a jump that was legal when it was drawn, over a step that later became
a reference source — the run does not fail. A reference to a method that did not
execute resolves to an **empty value**, and the run reports it.

Jumps and the graph
====================

* Moving nodes around can make a jump illegal — for instance by dragging the
  target into a loop. The editor removes jumps that no longer hold and tells you
  how many went, rather than saving a workflow that cannot run.
* Deleting the target deletes the jump with it.
* A jump is **not** an edge in the graph. It does not change a step's ``index``
  and does not affect where new steps land when you add them.

During a test run
=================

The travelling dot follows the jump on the transitions where the engine actually
took it. This is the only place the jump becomes visible: the log never records
"a jump happened", the skipped steps are simply absent from it. Watching the run
in debug mode is therefore the quickest way to confirm a jump fires when you
expect — see :doc:`debug-a-workflow`.

How it is stored
================

You do not need this to use the editor, only to work against the API.

The jump lives on the **source method** as ``jump``, whose value is the target's
hierarchical ``index``:

.. code-block:: json

   { "index": "1_0", "name": "getObjects", "methodType": "CONNECTOR",
     "jump": "1_2" }

The property was called ``jumpTo`` in pre-release builds; documents using the old
name are still read. Omitting ``jump`` means the method has no jump. See
:doc:`../reference/api`.

Where to go next
================

* :doc:`branch-and-loop` — the logic blocks a jump complements.
* :doc:`../concepts/workflow-model` — where jumps sit in the model.
* :doc:`debug-a-workflow` — watch one being taken.
