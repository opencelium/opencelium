##################
Configure Connections
##################

Connections and schedulers are more specific. We will consider them deeply.
List of the connections has the same user interface as users. Pressing on **:underline:`V`iew** you also can read information about the selected connection. Add and update procedures have more functionalities on the second page.

Add/Update Connection
=========

There are two options to add a new method. On the left part you select the method from the left connector and on the right side from the right connector correspondingly. 

Left Connector
=========

First of all you select a method in the dropdown list on the left and click on the icon. If you want to remove the method, just click on the cross icon on the right. The method has request and response parameters. The request parameters are right down the method. They have default value that you can change. If it is an object type, then you can type in json format or import the json text clicking on the Import button. If it is not an object, you type in parameter field a text. There is also a possibility to add a reference to the above method’s parameter But, there should be at least one method up. You type first symbol **$** and you will see two fields: method and param. Method field is a reference to the above method and param is a path to the parameter inside the method. When you create or click on the method, the system sets it as a current method. It is important, because the Mapping Fields area has a dropdown list of response parameters of the current method. The response parameters can be chosen from this list or you can add a new one clicking on the plus icon and entering Field Type and Name data. When you choose or add a response parameter there will be appeared a rectangle with a color of the method. After setting the method, you can add the next method or an operation. There are two types of operation: if and loop. If operation checks the parameter if it is null or not. If not it does what is defined inside the body of the operation. Loop operation go throw the data that you define in the method and param. Now you can add a new method or operation inside the body of the operation in or after it out. 

Right Connector
=========

On the right side you can also create methods and operations. But here you define input fields for the method from the selected response fields of the left connector and values can be several. After definition you will see another rectangle with the name of the parameter and color of the method. This item is connected with the correspond response parameters. Moreover, this element has an Enhancement function. Clicking on it you will see a window with the default simple mode set. The difference between simple and expert mode is that expert mode has just the editor for a program code and simple has a small user interface to define the request parameter of the right connector. Both modes requires a name and a description. The simple mode provides you variables, that represent the connected parameters from the left connector, constants, that you can define by your own, and operations, simple math operation: add, subtract, multiplication, division.The down part has the return parameter to which your instruction will be equalled. Just click twice on the variable, constant or operation and it appears there. If you click once, it will be just selected. When you set all data for the connectors and did mapping for the fields, press Add to save the connection.