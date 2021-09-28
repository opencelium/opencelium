##################
Manage Notification Templates
##################

Notification Templates can be managed from UI. Let us consider the next use case.

**You, as a user, want to manage templates for notifications in the OpenCelium.**

First of all you need to click on *Admin* menu. There is a *Notification Templates* item.
Navigate to it and you will see the list of templates with a search input (if the list is not empty).
The list provides *Name* and *Type* information.

|list|

Here you can as usually add, update or delete the template. When you add or update it, you
need to fill out *General Data* and *Template Content*. First one has *name* and *type* of
the template.

|general_data|

On the second form you enter *subject* and *body* of the template.

|template_content|

All fields here are required.

.. note::
	You can use next references inside the body: USER_NAME, USER_SURNAME, USER_TITLE, USER_DEPARTMENT, CONNECTION_ID, CONNECTION_NAME,, SCHEDULER_ID, SCHEDULER_TITLE.
    Just embrace it in curly brackets, for example: {CONNECTION_ID}

.. |list| image:: ../img/usecases/notification_templates/list.png
   :align: middle
.. |general_data| image:: ../img/usecases/notification_templates/general_data.png
   :align: middle
.. |template_content| image:: ../img/usecases/notification_templates/template_content.png
   :align: middle