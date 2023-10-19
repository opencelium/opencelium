##################
Manage Notification Templates
##################

Notification Templates can be managed from UI. Let us consider the next use cases.

**You, as a user, want to manage templates for notifications in the OpenCelium.**

First of all you need to click on *Admin* menu. There is a *Notification Templates* item.
Navigate to it and you will see the list of templates with a search input (if the list is not empty).
The list provides *Name* and *Type* information.

|list|

Here you can as usually add, update or delete the template. When you add or update it, you
need to fill out *General Data* and *Template Content*. First one has a *name* and a *type* of
the template. Type could be: *Email*, *Slack*, *Teams*.

*Data Aggregator* input is only for help. You can find there the desired aggregator and his arguments.
Clicking on the argument, it will be placed inside of the *body*.

In *Template Content* you enter a *subject* and a *body* of the template.

|form|

All fields here are required.

.. note::
	You can use next references inside the body: USER_NAME, USER_SURNAME, USER_TITLE, USER_DEPARTMENT, CONNECTION_ID, CONNECTION_NAME,, SCHEDULER_ID, SCHEDULER_TITLE.
    Just embrace it in curly brackets, for example: *{CONNECTION_ID}*

.. |list| image:: ../img/usecases/notification_templates/list.png
   :align: middle
.. |form| image:: ../img/usecases/notification_templates/form.png
   :align: middle