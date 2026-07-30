.. _management-invoker:

#######
Invoker
#######

An **invoker** defines the HTTP operations and the authentication configuration
for communicating with an external system. Connectors reference an invoker, and
workflow steps call the operations it exposes.

Invokers can be managed both from the UI and on the server directly.

Adding an invoker on the server
"""""""""""""""""""""""""""""""

Go to the root folder of the application, find the
``src/backend/src/main/resources/invoker`` folder, paste the invoker file
(``xml`` format) and restart the backend.

Adding an invoker from the UI
"""""""""""""""""""""""""""""

Go to **Configurations → Invokers** and create a new one. The wizard has three
steps.

**General Data** – the *Name*, the *Description* and the *Hint*. The hint is
displayed when a *Connector* is created, so use it to explain what the target
system expects.

**Authentication** – choose an *Authentication Type* and fill in the required
data fields. Four types are available: *API key*, *Token*, *Basic* and *Endpoint*
authentication. This step also holds the method that is used as the **test
connection**.

A *Name* is required and unique. The *Path* of each request can differ; the main
url is ``{url}`` — type it and add the endpoint if necessary. Choose a *Method*
and enter the *Request* and the *Response* (*Success* / *Error*) data in the
tabs that appear. Hover the icon next to *Headers* to see the hints. The *Body*
is entered in the editor, or pasted as a JSON string in the popup window.

**Operations** – the HTTP operations this invoker exposes. These are the calls
you pick in the workflow editor under *Use Connector*. Provide the information
the same way as in the previous step and add each operation.

Uploading and downloading invoker files
"""""""""""""""""""""""""""""""""""""""

Invoker files are exchanged as XML:

* upload a single file or a ZIP archive from the **Invokers** page,
* upload from the command palette with ``upload invoker``,
* download from the list, or with ``download invoker by name <name>``.

Synchronising invokers with the Service Portal
"""""""""""""""""""""""""""""""""""""""""""""""

Subscribers can have invokers synchronised automatically from the OpenCelium
Service Portal — see :ref:`management-smart_sync`.

.. note::
   When you change an invoker file manually, workflows that already use it are
   **not** updated automatically, because that is not always wanted. Synchronise
   them explicitly when you need the change to propagate.
