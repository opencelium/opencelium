##################
Call any API
##################

.. contents::
   :local:

You do not always want to write an invoker. 5.0 gives you two ways around it, plus
first-class GraphQL and XML support.

A one-off REST call
===================

Add a step with **Add HTTP Request**. You get a step with no invoker and no
connector, where you supply everything:

* the **HTTP method**, from a selector,
* the **URL**, which accepts references directly in the field,
* **headers**,
* the **body**.

Use it for an endpoint you call once, or a service too small to justify an invoker.

.. note::
   The trade-off: an invoker is reusable, self-documenting, gives you the
   connector health check, and can describe pagination. A simple HTTP request
   gives you none of that. If you find yourself adding the same raw call to
   several workflows, write an invoker instead —
   :doc:`../concepts/connectors-and-invokers`.

GraphQL
=======

Open a step's **Body** and choose the GraphQL editor. It is GraphiQL-based, with
schema autocomplete on ``Ctrl+Space``, and supports static and dynamic token
authentication.

.. warning::
   Only the query in the **active tab** runs when the step executes. Tabs are
   named after the query's operation name, so anonymous queries all show as
   ``<untitled>`` — name your operations if you keep several tabs.

Browsing the schema requires the master password. If none is configured the editor
says so; set ``opencelium.connector.master-password`` and restart, or use
:doc:`configure-the-system`.

XML
===

XML bodies have a tree view plus a raw XML view. Tags, text values and attributes
are edited in their own dialogs.

For references into an XML response, type ``@`` to get the attributes of a tag.

Reading the response
====================

Whatever the format, **Show Response** in the node context menu holds the response
definition — body, header and status — which is what the reference generator
offers to later steps.
