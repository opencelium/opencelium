##################
Connectors
##################

Connector is a core component in Open Celium. It is a system to which we
will send requests and get responses. They are can be different throw
different protocols: HTTP, JSON-RPC, SOAP, and so on. Currently, HTTP
and JSON-RPC are available. Connector uses invokers. Invoker is a
special file filled in with instructions.

The list of groups display a title one the left top corner and an icon
on the right top corner.

|image0|

Viewing the connector you can read a description of the connector itself
and information about invoker to which it was assigned, like: title,
description, and operations.

|image1|

Adding/Updating connector consists of two steps: general data, and
credentials. General data step has three input fields: *title*,
*description*, *invoker* and *icon*. The *title* and *invoker* are required
fields.

|image2|

Credentials step has several input fields. We need this step to set
connection to the system that describes invoker. The type of fields
depends on the chosen invoker. Different invokers have different
authentication systems, that are described inside of the invoker. All
fields usually are required. If the invoker has a *password* field, you
can click on the checkbox on the right to see what you are typing
instead of asterix. Before adding/updating you test the connection. If
it was completed successfully you can finish the process.

|image3|

.. |image0| image:: ../img/connector/0.png
   :width: 6.27083in
   :height: 3.83333in
   :align: middle
.. |image1| image:: ../img/connector/1.png
   :width: 6.27083in
   :height: 3.09722in
   :align: middle
.. |image2| image:: ../img/connector/2.png
   :align: middle
.. |image3| image:: ../img/connector/3.png
   :width: 6.27083in
   :height: 3.52778in
   :align: middle
