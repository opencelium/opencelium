.. _start-whats-new-5-1:

####################
What is new in 5.1
####################

.. contents::
   :local:

5.1 is an editor release. The workflow model of 5.0 is unchanged — nothing you
built needs converting, and no ``application.yml`` key moved. What changed is how
much the editor helps you while you work in it: you can now skip steps at
runtime, annotate the canvas for your colleagues, take back a mistake, and watch
a test run step by step instead of after the fact.

Upgrading from 4.x? Read :doc:`upgrade-to-5` first — that is where the breaking
changes are. From 5.0 the upgrade is a package update, see
:doc:`../operations/updating`.

Joints
======

A **joint** connects one step directly to a later one, so the steps in between
are skipped when the joint is taken. Until now the only way to skip work was an
``If`` operator around every step you wanted to pass over.

Select a method node, click the link icon in its toolbar, and pick the target.
Legal targets highlight; illegal ones tell you why. The joint is drawn in green
and stays visible on the canvas.

See :doc:`../guides/skip-steps-with-joints`.

Debug mode for test runs
========================

A test run now replays at a pace you can watch. The backend still executes at
full speed — only the presentation is slowed — and the canvas animates each
step as the run walks through it.

The debug panel gives you **pause**, **step forward** and a **speed** slider,
and a paused run inside a loop can be fast-forwarded to the next iteration or to
a specific one. **Live** mode is still one toggle away when you just want the
logs as fast as they arrive.

Starting a test asks which mode to use; dismissing that dialog permanently leaves
debug mode as the standing choice, with the Live toggle available per run.

See :doc:`../guides/debug-a-workflow`.

Undo and redo
=============

``Ctrl+Z`` undoes the last canvas change, ``Ctrl+Shift+Z`` or ``Ctrl+Y`` redoes
it. This covers everything you author — adding, deleting and moving nodes, edge
changes, request and condition edits, references and enhancements — not just node
placement. Deleting a step by mistake is no longer a reason to reload the page.

See :doc:`../guides/undo-and-history`.

Change history
==============

**Change History** in the header menu lists every change of the current editing
session, newest first, each with what it changed and when. Click any row to jump
the canvas straight to that point — an undo of arbitrary depth in one move.

It is separate from **Version History**, which restores states that were *saved*
on the server. :doc:`../guides/undo-and-history` explains when to reach for
which.

Comment boxes
=============

Notes on the canvas, anchored to a step. They travel with the node when you move
it, can be resized and minimised to a badge, and are stored with the workflow, so
the next person to open it reads what you meant rather than guessing.

See :doc:`../guides/annotate-a-workflow`.

And the rest
============

Beyond the five features above, 5.1 carries a long list of smaller improvements:
customisable data masking in logs, enhanced webhook variables, support for
multiple success and failure responses, master-password support and partial
updates for connectors, resizable table columns, theme, logo and language
preferences stored on the server, error highlighting in execution logs, and a
large number of fixes. The complete list is in the `changelog
<https://github.com/opencelium/opencelium/blob/prod/CHANGELOG.rst>`_.

Where to go next
================

* :doc:`../guides/skip-steps-with-joints` — the joint element.
* :doc:`../guides/debug-a-workflow` — debug mode.
* :doc:`../guides/undo-and-history` — undo, change history, version history.
* :doc:`../guides/annotate-a-workflow` — comment boxes.
* :doc:`../operations/updating` — how to install the update.
