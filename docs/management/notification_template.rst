.. _management-notification_template:

#####################
Notification Template
#####################

Notification templates define the content and format of the messages the system
sends from schedules. They are managed from the UI under
**Configurations → Notification Templates**.

Managing templates
""""""""""""""""""

The list shows the *Name* and the *Type* of each template and has a search
field. Templates are created, updated and deleted here, or from the command
palette with ``create notification-template``,
``update notification-template by name <name>`` and
``delete notification-template by name <name>``.

The wizard has two steps:

* **General Data** – the *name* and the *type* of the template. The type can be
  *Email*, *Slack* or *Teams*.
* **Template Content** – the *aggregator*, the *subject* and the *body*. Use the
  aggregator's arguments to insert dynamic values.

The *Data Aggregator* input is a helper: pick the aggregator you want and click
one of its arguments to place it into the *body*. See
:ref:`management-data_aggregator`.

All fields are required.

.. note::
	You can use the following references inside the body: USER_NAME,
	USER_SURNAME, USER_TITLE, USER_DEPARTMENT, CONNECTION_ID, CONNECTION_NAME,
	SCHEDULER_ID, SCHEDULER_TITLE.

	Just embrace them in curly brackets, for example: *{CONNECTION_ID}*

.. note::
	``CONNECTION_ID`` and ``CONNECTION_NAME`` refer to the **workflow** — the
	reference names were kept unchanged in 5.0 so existing templates keep
	working.

Channel payloads
""""""""""""""""

The *subject* and *body* you enter are wrapped into the payload the target
channel expects. 5.0 ships the payload templates for the supported channels in
``src/backend/src/main/resources/notification/``:

.. list-table::
   :header-rows: 1
   :widths: 25 75

   * - File
     - Payload
   * - ``default.json``
     - Plain text: ``${subject}`` followed by ``${text}``.
   * - ``slack.json``
     - A Slack *blocks* payload — a ``header`` block with the subject and a
       ``section`` block with the body as ``mrkdwn``.
   * - ``teams.json``
     - A Microsoft Teams message with an adaptive card (schema version 1.4)
       whose first ``TextBlock`` holds the subject and the second the body.

``${subject}`` and ``${text}`` are substituted with the rendered subject and
body of your template. Adjust these files if your workspace expects a different
card layout.

Using a template
""""""""""""""""

A notification template is selected when you create a notification on a
schedule. See :ref:`scheduler_notifications` for the event types (*pre*, *post*,
*alert*), the notification types (e-mail, webhook) and how to assign one
notification to several schedules at once.
