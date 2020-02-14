##################
Scheduler
##################

Scheduler defines when and what connection should be performed. All CRUD
actions are on one page. To add a new job for scheduler you need to fill
out 4 required fields: *title, connection, start time* and *cron
expression*. If data will be invalid you will be informed through
notifications after clicking **Add Job**.

|image0|

The list of schedules displays next information: *title, connection,
last date*, time of *last success* trigger, time of *last failed*
trigger, and *status*. If background of status grey, it means that job
was not still triggered, if green - last performance was successful and
red, if it was failed. There is also a switcher that gives you an
ability to enable or disable schedule. The background of the whole row
becomes grey it you disable schedule. The *Action* column has three
icons: |image1|- *start job* (immediately), |image2| - *update* and
|image3|- *delete* job.

|image4|

Clicking on the *time* in the *Date* column, the message will appear
with the whole date information. If you click on the *cron*, you will
see a full cron expression.

|image5| |image6|

.. |image0| image:: ../img/schedule/image5.png
   :width: 6.27083in
   :height: 3.11111in
   :align: middle
.. |image1| image:: ../img/schedule/image6.png
   :width: 0.29167in
   :height: 0.30208in
.. |image2| image:: ../img/schedule/image7.png
   :width: 0.31250in
   :height: 0.31250in
.. |image3| image:: ../img/schedule/image1.png
   :width: 0.30208in
   :height: 0.32292in
.. |image4| image:: ../img/schedule/image2.png
   :width: 6.27083in
   :height: 3.12500in
   :align: middle
.. |image5| image:: ../img/schedule/image3.png
   :width: 2.89063in
   :height: 0.84675in
   :align: middle
.. |image6| image:: ../img/schedule/image4.png
   :width: 2.87481in
   :height: 0.85938in
   :align: middle
