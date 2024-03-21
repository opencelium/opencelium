*********
Changelog
*********

|
|
3.2.1
========

:Date: March 19, 2024

Features
--------

* Handling Pagination Data

Fixes
--------

* Bug in communication check function (OC-733)
* LIKE operator in If condition not working (OC-795)
* Rename SSL Switch (OC-799)
* Loop / SplitString not working (OC-797)
* operator regex is not supported (OC -559)
* Converter Add MimeType (OC-805)

|
3.2
========

:Date: October 20, 2023

Features
--------

* Data Aggregator
* Extended Notification Type: added slack and teams support
* New Connection Panel for actions
* Animation tutorial
* Shortcuts for connection editor
* Invoker synchronization for connection
* Delete reference option in method's body
* Added legends for references in methods' body
* Protection from auto log out when the session is expired

Fixes
--------

* Add invoker with empty operations (OC-665)
* Delete of selected templates (OC-670)
* Saving methods' headers (OC-734)
* Proxy bug (OC-758)

|
3.1.2
========

:Date: Juli 27, 2023

HotFix
--------

* add proxy feature (OC-636)

|
3.1.1
========
:Date: June 23, 2023

HotFix
--------

* i-doit->OTRS "config item create/update" doesn't work (OC-616)

|
3.1
===
:Date: April 26, 2023

Features
--------

* Update from Java 8 to Java 17 (latest lts version)
* Update from Neo4j 3.5 to Neo4j 5.6 (latest lts version)
* Update from Spring Boot 2.0 to Spring Boot 3.0 (latest lts version)
* Connection Edior improvements:
* Show connection logs on the web interface
* Added test run
* Allow changing size of items
* Saving connection on fullscreen
* Copy methods with dependencies to duplicate them
* Move methods or operators with automatic dependency checking
* Show label instead of api method name in the reference browser
* Service Portal new features:
* CSV Generator to easily generates/manage your own CSV-Invoker files
* Sends automatic notifications when subscription is extended

Connector
---------

* RedmineCRM
* Dell Warrenty Check
* StarFace
* Weclapp


Fixes
-----

* js error in developer tools (OC-483)
* clicking on external apps doesnt work (OC-533)
* themes from service portal are not synced to opencelium (OC-557)
* cant update a connection (OC-563)
* after login into opencelium a git error appears in logs (OC-565)
* waiting to long to get connections on frontend (OC-566)


Major Relase :loudspeaker:
============

|
3.0
===
:Date: October 25, 2022

Features
--------

* New Service Portal
* Marketplace to get all invoker and business template files
* Service Center to create ticket requests
* Api converter to generate invoker files from openapi or wsdl files

Connector
---------

* Matrix42
* phpIPAM
* Baramundi Management Suite
* Tenable
* Xen Orchestra
* Work4all

Fixes
-----

* Problems saving a connection (OC-476)
* Error updating scheduler (OC-485)
* There was a problem trying to download a template (OC-473)
* js error in developer tools (OC-483)

|
2.4
===
:Date: July 22, 2022

Features
--------

* Gravatar support
* Inline editor function
* Offline mode
* Add marketplace for service portal

Fixes
-----

* error after using inline editor (OC-477)
* duplicate template (OC-475)
* could not save connection after deleting field binding (OC-476)
* session expired appeared when try to download a template (OC-473)
* error during creating a field (OC-468)

|
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

|
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
* new frontend engine has some issuesÃ¢â‚¬Â¦ (OC-438)
* error during updateing a connector (OC-439)

|
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

|
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

|
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

|
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

|
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

|
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

|
1.0
===
:Date: Februar 1, 2020

Connector
---------

* i-doit
* Zabbix
* Icinga2
* OTRS/Znuny/OTOBO

