##################
Schedules
##################

The *Schedules* panel shows an overview of all schedules that have been set up. In
general, a schedule defines which connection should be performed when. All CRUD 
actions are one one page. The list view shows the following information for each
connection:

   * **Status**
      * **grey**: connections without Cron-job
      * **green**: last run was successful
      * **red**: last run was unsuccessful
   * Name of the **connection**
   * **Cron** expression
   * Date and time of the last **successful run** of the connection
   * Date and time of the last **unsuccessful run** of the connection
   * **Duration** of the last successful run
   * Switch for activating/deactivating the **logs**
   * **Webhook**

Above the list you can see the categories. These are categories defined
on the :ref:`connection page <usage-connection>`. You cannot modify them
here. All displayed schedules can be filtered by the corresponded connection category.

|image_schedules_1|

The logs could be enabled/disabled directly here clicking on the toggle button.

If the schedule contains webhook, it could be copied clicking on the icon: |image4|.
The url is stored in the clipboard. Now you can paste it where you need.

The *Action* column has six additional icons:

|image_schedules_10| - *edit*

|image_schedules_11|- *start* job (immediately)

|image_schedules_12| - *webhook*

|image_schedules_13| - *notifications*

|image_schedules_14| - *logs*

|image_schedules_15| - *delete*

Below the list view, the progress of a connection is displayed if it has been started
manually or automatically by a trigger. A running connection can be canceled by clicking
on the "**x**" on the right side.

|image_schedules_2|

|image17|

Adding a new schedule
"""""""""""""""""

To add a new job for the scheduler click on the button "Add Schedule". 

|image_schedules_3|

An empty mask opens where you have to enter the following information:

   * **title** (mandatory)
   * **connection** (mandatory)
   * **logs** (optional, disabled by default)
   * **cron expression** (optional)

|image_schedules_4|

The *title* is displayed in the list of the Schedules panel. It should be descriptive to
make it easy to identify the correct schedule.

Activate the *logs* if required; they are deactivated by default to avoid unnecessary
logging. The logging function can also be activated later if required.

Use the search function or the drop down list to select one existing *connection*. The
description of the connections is displayed as well to make the identification of the
correct connection more easy.

|image_schedules_5|

The definition of the cron expression can be done easily with the cron generator
|image_schedules_10|. Here you can choose the exactly or each timestamp when the job should
be triggered. Setting all data, you will see a list of the nearest triggering timestamps.

|image_schedules_6|

As soon as all required settings have been made click on the button "Add" sto save the
schedule.

|image_schedules_7|

Cron Generator
"""""""""""""""""
The Cron Generator supports you in creating the most common cron expressions for triggering
the schedules. To create a cron expression, select the desired values from the selection
lists. Below the selection lists, you will see a preview of when the job would run with
the current settings.

|image_crongenerator_1|

Once you have made the desired settings, confirm the settings by
clicking on the “**OK**” button.

|image_crongenerator_2|

The finished expression is now displayed in the "*Cron Expression*" field. Alternatively,
you can also enter an expression directly in the “*Cron Expression*” field.

|image_crongenerator_3|

A cron expression is a string comprised of 6 or 7 fields separated by white space. The
first 6 fields are mandatory, the last field is optional. The following fields are used
in a cron expression:

   * Second
   * Minute
   * Hour
   * Day of the month
   * Month
   * Day of the week
   * Year (optional)

Save the schedule by clicking on the “**Add**” or “**Update**” button.

|image_crongenerator_4| or |image_crongenerator_5|

OpenCelium uses the Quartz Job Scheduling Library for the cron jobs.

On the Quartz page you will find `examples`_ for the correct creation of cron expressions,
which can be used in OpenCelium.

.. _examples: https://www.quartz-scheduler.org/documentation/quartz-2.2.2/tutorials/crontrigger.html

**Examples:**

.. code-block::

   0 0 12 * * ?

**Meaning:** Run at 12pm (noon) every day

.. code-block::

   0 * 14 * * ? 

**Meaning:** Run at 10:15am every day

.. code-block::

   0 0/5 14,18 * * ? 

**Meaning:** Run every 5 minutes starting at 2pm and ending at 2:55pm, AND fire every 5 minutes starting
at 6pm and ending at 6:55pm, every day

Webhook
"""""""""""""""""
A *webhook* allows a connection to be triggered using a URL that is called up. A
webhook can be created for each schedule by clicking on the corresponding action for creating
a webhook |image_schedules_12|.

If a webhook has been created for a schedule, this can be seen from the corresponding
icon |image_schedules_17| in the column *Webhook*.

Clicking on the icon |image_schedules_17| copies the URL of the webhook to the clipboard so that it can be
inserted at the desired location.

Clicking on the icon |image_schedules_16| disables the webhook for the respective schedule again.

Notifications
"""""""""""""""""

The *notifications* are a feature that allows you to be informed about certain events via e-mail
or webhook. The available events are pre, post and altert.

   * **pre** - notification is triggered **before** the schedule
   * **post** - notification is triggered **after** the schedule
   * **altert** - notification is triggered in the **event of an error**.

.. note::
   The aggregator only applies for post events.

You can assign a notification to several schedules. To do this, select the desired schedules in the
list by clicking on the checkboxes and click on the “**Notification**” button |image_notifications_4|.

|image_notifications_1|

If you only want to assign a notification to one schedule, you can alternatively click on the letter
symbol |image_notifications_7| and then on the plus sign to create a new notification.

|image_notifications_2|

.. note::
   Before you create a notification, you need to create a template that is described :ref:`here <management-notification_template>`.

After clicking on "**Add**", provide *name*, *event*, *notification type* and *after template*.

|image_notifications_3|

Select the desired notification type (E-Mail or webhook). For E-mail type you need to select the 
recipients who gets a notification. For webhook type you need to provide the webhook of the target system.

|image_notifications_5|

After creating the notification you will see a list of notifications and a search where you can search
for a notification by name, event or notification type. You can *update* or *delete* the corresponding notification,
if you mouse over on one of them and click on the respective icon.

|image_notifications_6|

.. _scheduler_execution_log:

Execution Logs
"""""""""""""""""

Each job in the Scheduler includes a detailed **Execution Log** view.  
The log viewer uses the same interactive **UI-Log interface** as the *Test-Run* feature in the Connection Editor,  
allowing users to inspect requests, loops, and responses in a structured, tree-based layout.

For each scheduled job, the system automatically maintains historical logs for both **successful** and **failed** executions:

- **Success Logs:** retain the two most recent successful runs  
- **Fail Logs:** retain the three most recent failed runs  

This retention behavior can be adjusted in the backend configuration file (`application.yml`):

.. code-block:: yaml

   log:
     retention:
       per-connection:
         success: 2
         fail: 3

Adjusting these values changes how many historical logs are stored per connection or scheduled job.  
Older logs exceeding the defined retention limits are automatically removed.

.. note::
   To ensure that the logs are created according to the configuration, they must be activated for the 
   respective job (the switch in the column **Logs** must be active).

|image_execution_logs_1|

The entries in the columns **Last Success** and **Last Fail** give you direct access to the corresponding logs. 
Click directly on the job number to open the log in the log viewer. The three dots also give you access to the 
logs of past jobs (if configured).

|image_execution_logs_2|

...and this is the :ref:`UI log viewer <connection_ui_logger>`, which we also use for the test run.


Support Logs
"""""""""""""""""
The *Logs* feature allows you to create comprehensive log files for support in case your connection 
is not working and you need help troubleshooting.

Clicking on the |image_support_logs_1| icon opens a view where you can configure the support logs as
needed by masking certain parts of the logs.

|image_support_logs_2|

In the upper area, you can select a desired preset for the degree of masking. 

|image_support_logs_3|

The following levels are available:

.. list-table::
  :width: 100 %
  :widths: 20 20 20 20 20
  :header-rows: 1

  * - Masking Level
    - URL
    - Headers
    - Request
    - Response

  * - **Light**
    - |image_support_logs_4|
    - |image_support_logs_5|
    - |image_support_logs_5|
    - |image_support_logs_5|

  * - **Medium**
    - |image_support_logs_4|
    - |image_support_logs_4|
    - |image_support_logs_5|
    - |image_support_logs_5|

  * - **Strict**
    - |image_support_logs_4|
    - |image_support_logs_4|
    - |image_support_logs_4|
    - |image_support_logs_5|

  * - **Custom**
    - |image_support_logs_4| / |image_support_logs_5|
    - |image_support_logs_4| / |image_support_logs_5|
    - |image_support_logs_4| / |image_support_logs_5|
    - |image_support_logs_4| / |image_support_logs_5|

Alternatively, you can also select individual elements and mask them by clicking on the icon with the
crossed-out eye |image_support_logs_4|, thus making them unrecognizable for support. Clicking on the icon with the uncrossed
eye unmasks the element again |image_support_logs_5|.

Once you have made the desired settings, click on the button to generate the support logs.

|image_support_logs_6|

The process of generating the support logs starts the selected connection,
generates the logs, and saves them together with the invoker files as a ZIP file. 
Corresponding messages in the notifications indicate the start and successful generation of the support logs.

The generated support logs can be accessed either via the link in the notification or under Support Files
in the admin panel.

.. |image_schedules_1| image:: ../img/schedule/OC_schedules_list.png
   :align: middle
   :width: 600
.. |image_schedules_2| image:: ../img/schedule/OC_schedules_current_job.png
   :align: middle
   :width: 600
.. |image_schedules_3| image:: ../img/schedule/OC_schedules_button_add_schedule.png
   :align: middle
   :height: 30
.. |image_schedules_4| image:: ../img/schedule/OC_schedules_add_general_data.png
   :align: middle
   :width: 400
.. |image_schedules_5| image:: ../img/schedule/OC_schedules_add_connection.png
   :align: middle
   :width: 400
.. |image_schedules_6| image:: ../img/schedule/OC_schedules_cron_generator.png
   :align: middle
   :width: 400
.. |image_schedules_7| image:: ../img/schedule/OC_schedules_button_add.png
   :align: middle
   :height: 30

.. |image_schedules_10| image:: ../img/schedule/OC_schedules_icon_edit.png
   :height: 21
.. |image_schedules_11| image:: ../img/schedule/OC_schedules_icon_play.png
   :height: 21
.. |image_schedules_12| image:: ../img/schedule/OC_schedules_icon_webhook.png
   :height: 21
.. |image_schedules_13| image:: ../img/schedule/OC_schedules_icon_notification.png
   :height: 21
.. |image_schedules_14| image:: ../img/schedule/OC_schedules_icon_logs.png
   :height: 21
.. |image_schedules_15| image:: ../img/schedule/OC_schedules_icon_trash.png
   :height: 21
.. |image_schedules_16| image:: ../img/schedule/OC_schedules_icon_disable_webhook.png
   :height: 21
.. |image_schedules_17| image:: ../img/schedule/OC_schedules_icon_copy_webhook.png
   :height: 21

.. |image17| image:: ../img/schedule/17.png
   :align: middle
   :width: 600

.. |image_crongenerator_1| image:: ../img/schedule/OC_crongenerator_helper.png
   :align: middle
   :width: 400
.. |image_crongenerator_2| image:: ../img/schedule/OC_crongenerator_btn_ok.png
   :align: middle
   :height: 30
.. |image_crongenerator_3| image:: ../img/schedule/OC_crongenerator_cron_expression.png
   :align: middle
   :width: 400
.. |image_crongenerator_4| image:: ../img/schedule/OC_crongenerator_btn_add.png
   :height: 30
.. |image_crongenerator_5| image:: ../img/schedule/OC_crongenerator_btn_update.png
   :height: 30

.. |image_notifications_1| image:: ../img/schedule/OC_notifications_list_schedules.png
   :align: middle
   :width: 600
.. |image_notifications_2| image:: ../img/schedule/OC_notifications_add_notification_2.png
   :align: middle
   :width: 300
.. |image_notifications_3| image:: ../img/schedule/OC_notifications_add_notification.png
   :align: middle
   :width: 400
.. |image_notifications_4| image:: ../img/schedule/OC_notifications_btn_notification.png
   :height: 30
.. |image_notifications_5| image:: ../img/schedule/OC_notifications_notifications_type.png
   :align: middle
   :width: 400
.. |image_notifications_6| image:: ../img/schedule/OC_notifications_edit_delete.png
   :align: middle
   :width: 300
.. |image_notifications_7| image:: ../img/schedule/OC_notifications_btn_mail.png
   :height: 21

.. |image1| image:: ../img/schedule/1.png
   :width: 30
.. |image2| image:: ../img/schedule/2.png
   :width: 30
.. |image3| image:: ../img/schedule/3.png
   :width: 30
.. |image4| image:: ../img/schedule/4.png
   :width: 30
.. |image10| image:: ../img/schedule/10.png
   :width: 30
.. |image14| image:: ../img/schedule/14.png
   :width: 30

.. |image20| image:: ../img/schedule/20.png

.. |image_support_logs_1| image:: ../img/schedule/OC_support_logs_icon_logs.png
   :height: 21
.. |image_support_logs_2| image:: ../img/schedule/OC_support_logs_config.png
   :align: middle
   :width: 400
.. |image_support_logs_3| image:: ../img/schedule/OC_support_logs_masking_level.png
   :align: middle
   :width: 400
.. |image_support_logs_4| image:: ../img/schedule/OC_support_logs_icon_eye_crossed.png
   :height: 21
.. |image_support_logs_5| image:: ../img/schedule/OC_support_logs_icon_eye_open.png
   :height: 21
.. |image_support_logs_6| image:: ../img/schedule/OC_support_logs_btn_create_logs.png
   :align: middle
   :height: 30
.. |image_execution_logs_1| image:: ../img/schedule/OC_execution_logs_overview.png
   :height: 300
.. |image_execution_logs_2| image:: ../img/schedule/OC_execution_logs_uilog.png
   :align: middle
   :height: 400
