####################
Your first workflow
####################

.. contents::
   :local:

This walks through building a working integration from an empty system. It takes
about twenty minutes and produces a workflow that reads records from one API and
writes them to another, on a schedule.

You will need a running OpenCelium (:doc:`install`) and credentials for two APIs.
If you only want to try the mechanics, any two HTTP endpoints will do — you can
use *Simple HTTP request* steps and skip the invoker work entirely.

.. note::
   Signed in for the first time? The default account is
   ``admin@opencelium.io`` / ``1234``. Change it.

1. Make the systems known
=========================

Each system needs an **invoker** (how to talk to that kind of API) and a
**connector** (one instance of it, with credentials).

Check **Configurations → Invokers** first: if an invoker for your product already
exists — shipped, uploaded, or synchronised from the Service Portal — you are
done with this part. If not, create one, or take the shortcut in step 3.

Then create a connector per system under **Connectors → Create**:

#. **General Data** — a title, the invoker, and optionally a timeout and icon.
#. **Credentials** — the fields the invoker's authentication type requires.

Use **Test connection** before submitting. If it fails, OpenCelium asks you to
confirm explicitly rather than silently storing a broken connector — fix the
credentials instead.

Do this twice, once per system.

2. Create the workflow
======================

Press ``Alt+W``, or use **Create Workflow** in the top bar. The editor opens on an
empty canvas with a single **Start** node.

Give it a title straight away: click the title in the header and type. Titles must
be unique, and the check runs as you type.

3. Add the first step
=====================

Hover the Start node and click the **+** handle. The step drawer opens with
*Choose your next step*:

* **Use Connector** — pick your source connector, then the operation that reads
  the records. This is the normal path.
* **Add HTTP Request** — if you skipped the invoker: pick the HTTP method and
  enter the URL yourself.

The step appears on the canvas showing the connector icon and the method name.
Note its status dot: green means the connector's test passed.

Double-click the step to inspect its request. For a connector method the HTTP
method is fixed by the invoker; the URL, headers and body are editable.

4. Loop over the results
========================

The source call returns a list, and you want one write per element.

Hover the first step, click **+**, choose **Add Operator**, then **Loop**.

Double-click the Loop node to open its condition. Choose the ``For`` operator and
point its argument at the array in the first step's response — use the reference
generator: *connector → method → field*, and pick the array with ``[*]``.

The Loop node exposes a **loop variable** (the iterator). The info panel next to
the condition shows it, with examples.

5. Add the write step inside the loop
=====================================

Use the **+** handle on the Loop node's nested path — not the one continuing past
it — and add a step on your target connector: the operation that creates or
updates a record.

6. Map the data
===============

This is the actual integration. Open the write step's **Body**.

The body shows as a JSON tree. Select the field you want to fill, then insert a
reference to the source step's corresponding field. Because you are inside a loop,
append the iterator so each iteration takes its own element — for iterator ``i``
and field ``result``, that is ``result[i]``.

Repeat per field. A field holding only a reference is a **direct reference**: a
straight copy, and the fastest option.

When a value needs transforming — uppercase, a date reformat, concatenating two
fields — use **Create enhancement** on the reference. You get a script seeded with
``RESULT_VAR = VAR_0``, where ``VAR_0`` is your reference and ``RESULT_VAR`` is
the field's value:

.. code-block:: javascript

   RESULT_VAR = VAR_0.toUpperCase();

.. note::
   Prefer direct references. Only add a script where you genuinely transform the
   value — see :doc:`../concepts/data-mapping`.

7. Test it
==========

Save with ``Ctrl+S``, then start a **test run** from the header. It executes the
current editor state and streams logs into the panel at the bottom.

Expand the tree to see each call with its URL, status, duration and payloads. If a
call fails, the viewer takes you to it: red trace dots, loops paged to the failing
iteration, the error shown on the step.

Iterate here until it does what you want. Test runs are cheap and only one runs at
a time per workflow.

8. Schedule it
==============

Once it works, give it a schedule. Either use the **schedules pill** in the editor
header — **Add schedule**, scoped to this workflow — or go to **Schedules →
Create**.

A schedule needs a title and a workflow; the cron expression is optional, and the
generator builds one for you with a preview of the next runs. Leave logging off
unless you need it, and switch it on from the list when you do.

.. note::
   Only one schedule per workflow runs at a time.

9. Get told when it breaks
==========================

Create a notification template under **Configurations → Notification Templates**,
then attach a notification to the schedule with event type **alert** so a failure
reaches you by e-mail or webhook.

See :doc:`../guides/schedule-and-notify`.

Where to go next
================

* :doc:`../guides/branch-and-loop` — conditional logic beyond a simple loop.
* :doc:`../guides/debug-a-workflow` — when it does not work.
* :doc:`../guides/reuse-with-templates` — turn this into a template for the next
  environment.
* :doc:`../concepts/index` — the model behind what you just did.
