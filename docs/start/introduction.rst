############
Introduction
############

.. contents::
   :local:

What OpenCelium is
==================

OpenCelium is an integration platform. You describe how APIs talk to each other —
which calls to make, in which order, and how data maps between them — and
OpenCelium runs it on a schedule or on demand. Everything is done through a web
interface; you do not write integration code, though you can drop into a script
where a transformation needs it.

A typical use: your CMDB holds the authoritative list of servers, your monitoring
system needs to know about them. A workflow reads the objects from the CMDB,
loops over them, and creates or updates the corresponding hosts in monitoring.
A schedule runs it every night.

The pieces
==========

.. list-table::
   :header-rows: 1
   :widths: 24 76

   * - Piece
     - What it is
   * - **Invoker**
     - A definition of an API: its authentication and its operations. Written
       once per product. See :doc:`../concepts/connectors-and-invokers`.
   * - **Connector**
     - One concrete system, using an invoker plus credentials. `Production
       CheckMK` is a connector.
   * - **Workflow**
     - The integration itself: an ordered, branching sequence of steps, each
       calling a connector. See :doc:`../concepts/workflow-model`.
   * - **Schedule**
     - When a workflow runs — a cron expression, a manual start, or a webhook.
   * - **Notification**
     - Who gets told, over e-mail or webhook, before/after/on failure.

The shortest possible path: create connectors for the two systems, build a
workflow between them, attach a schedule.

What is new in 5.0
==================

If you have used OpenCelium before, these are the changes that matter.

**Connections became Workflows, and the two-connector limit is gone.** Previously
an integration had exactly one source and one target connector; touching a third
system meant splitting it across several connections. Now every step names its own
connector, so one workflow can call any number of systems in any order, including
bidirectionally. This is a real model change, not a rename —
:doc:`../concepts/workflow-model` explains it.

**Steps that are not connector calls.** A *Simple HTTP request* step lets you call
an endpoint directly, with your own method, URL, headers and body, without writing
an invoker. A *Trigger Workflow* step starts another workflow's schedule.

**Live connector availability.** Connector nodes show a status dot while you
build, so an unreachable system is visible before the workflow goes to production.

**A command palette.** ``Ctrl+K`` anywhere: open lists, create and update
entities, upload and download templates and invokers, or fuzzy-search the
workflow you have open. See :doc:`../reference/command-palette`.

**A rebuilt interface**, on Ant Design, with a two-menu navigation, consistent
lists and wizards, and light/dark themes throughout.

**Server configuration from the UI.** ``application.yml`` can be edited under
*License & System → Configurations*, with comments preserved, secrets masked and
automatic backups. See :doc:`../guides/configure-the-system`.

**System Check.** One page reporting the health of OpenCelium, MariaDB, MongoDB,
the mail server, the polyglot engine and the host.

**A dashboard with history** — seven days of executions and failures, live CPU
and memory, top workflows by execution count.

**Password reset**, requested from the login page.

Upgrading from 4.x? Read :doc:`upgrade-to-5` before you start: your workflow
documents are converted on read without being rewritten, but two
``application.yml`` keys moved and the frontend endpoint configuration changed.

Where to go next
================

* :doc:`install` — get a server running.
* :doc:`first-workflow` — build a working integration end to end.
* :doc:`../concepts/index` — understand the model properly.
