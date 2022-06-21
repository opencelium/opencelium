*********
Changelog
*********

2.3
===
:Date: June 21, 2022

Features
--------

* Manage own CI theme on service portal
* Support multi-step authentification
* OAuth2 support for service portal

Connector
---------

* JDisc Discovery
* CheckMK 2
* OpenManage Enterprise
* Adaxes

Fixes
-----

* scheduler add error (OC-459)
* scheduler update error (OC-460)
* template delete error (OC-461)

2.2
===
:Date: April 14, 2022

Features
--------

* Support POST Request for webhooks
* Enable/disable SSL verification for connectors
* Manage connection timeouts for connectors


Connector
---------

* Jira Insight

Fixes
-----

* ssl_verify error (OC-435)
* can't save the template (OC-444)
* increment index on arrays in xml (OC-440)
* new invokers and templates are available (OC-443)
* new frontend engine has some issuesâ€¦ (OC-438)
* error during updateing a connector (OC-439)

2.1
===
:Date: Januar 18, 2022

Features
--------

* Enable/disable logs for a job
* Dupplicate connections
* Dupplicate business templates
* Edit business templates

Fixes
-----

* Image is deleted (OC-425)
* API Operation didnt execute correctly with the fields defined in the invoker file (OC-417)
* Layout problems when deleting a connection (OC-419)
* Starting a job (OC-424)
* When you update a job, it is automatically activated (OC-423)


Major Relase :loudspeaker:
============

2.0
===
:Date: October 1, 2021

Features
--------

* New web interface 2.0
* New Connection Editor 2.0
* New Notification Service
* Improved menu tree
* Job Crontab Generator

Connector
---------

* FreshDesk
* Redmine
* SAP Solution Manager
* SAP Business One
* Jira Service Desk
* Jira Asset

Fixes
-----

* Connection crashed after making some changes (OC-341)
* Json tool could not add new property in old connection layout (OC-364)
* Layout problems when deleting a connection (OC-384)
* Wrong position of the title from dashboard widget (OC-362)

1.4
===
:Date: Mai 19, 2021

Features
--------

* Add dashboard widget
* Add update assistant
* Add new operator allow/deny list
* Add params in webhook
* Add tool opencelium-addon for i-doit
* Add tool apiextension for otrs/znuny/otobo
* Add tool webservice configuration for otrs/znuny/otobo

Fixes
-----

* Creates a white method what could not use (OC-299)
* Wrong synax generated on a query by using ref generator (OC-330)

1.3
===
:Date: November 30, 2020

Features
--------

* Supporting xml as a content-type
* Template converter. Converts old templates to newer version
* Adding a draft function to restore connections
* Adding operator "PropertyExists" and "PropertyNotExists" in connection editor

Fixes
-----

* Added property "sessionTime" when generating token (OC-257)
* Fixed bug where liquebase throw an exception (OC-257)
* Fixed bug in TooltipFontIcon (OC-160)

1.2
===
:Date: July 8, 2020

Features
--------

* Send method test calls in connection view
* Managing notifications for a job (PRE/POST/ALERT)

Connector
---------

* Jira
* Bitbucket
* Trello
* PRTG Network Monitor
* Aruba Clearpass
* CSV2API
* DB2API

Fixes
-----

* Sorting of the items in Connection (Add/Update) is wrong if the amount is more than 10 (OC-238)
* Minimize(maximize) animation works not stable in Connection (Add/Update) (OC-239)
* The removing of last item in the subtree of Connector does not work correctly in Connection (Add/Update) (OC-240)
* Update from v1.0 to v1.1 (OC-241)
* Scheduler saving (OC-250)
* Backend creates job even crontab entered wrong (OC-251)
* Fix bug when updating connector with null value of image property (OC-258)

1.1
===
:Date: April 7, 2020

Features
--------

* Send method test calls in connection view
* Managing notifications for a job (PRE/POST/ALERT)

Connector
---------

* Azure
* Sensu
* OpenNMS
* CheckMK
* AWS

Fixes
-----

* Execute several jobs doesnt work (OC-226)
* Connection get error via notification (OC-206)
* No kibana link was created after triggering a job (OC-189)
* Connection get error via notification (OC-189)
* Scheduler saving (OC-250)
* First execution job will not be updated on scheduler view (OC-225)

Major Relase :loudspeaker:
============

1.0
===
:Date: Februar 1, 2020

Connector
---------

* i-doit
* Zabbix
* Icinga2
* OTRS/Znuny/OTOBO