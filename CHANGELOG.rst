*********
Changelog
*********

4.7
========

:Date: Dezember 17, 2025

Fixes
--------
* Fix if operator socket error (OC-1302)
* Show correct error during invoker Sync (OC-1301)
* Master Password should accept only ascii values (OC-1300)
* Fix Response Headers (OC-1299)
* Fix Test connection when license expired (OC-1298)
* Fix GraphQL master password (OC-1297)
* Fix endpoint editor (OC-1296)
* Test license when it is expired (OC-1295)
* Test GraphQL (OC-1294)
* In 4.7 I cannot add a connection from idoit to otrs (OC-1293)
* Check property exist for root payload (OC-1291)
* Fix Logo image fetched from SP (OC-1290)
* Invoker Files Reappear After Deletion (OC-1289)
* Copy Connection ‚Äì Original Connection Gets Broken (OC-1288)
* Remove old Jar files Manualy (OC-1287)
* Fix current schedule title position (OC-1285)
* Fix XMLView layout in Connection Editor (OC-1284)
* Array with two elements and ref doesn't work  (OC-1283)
* null values doesn't support (OC-1278)
* Fix scroll of request data in Body (OC-1275)
* Check test connection logs: empty loop operator (OC-1266)
* Bug fixing in v4.7 [Frontend] (OC-1265)
* Test Online License Management (OC-1253)
* Error during execution; wrong reference (OC-1245)
* application changelog function incorrectly for rename operation (OC-1244)
* masster-password space is not handled (OC-1243)
* Bug with slack response in Logs (OC-1232)
* RegEx or Like doesn't work with single quote (OC-1231)
*  Polyglot as external service JAR (OC-1223)
* log-files endpoint refactoring (OC-1222)
* Fix Like and NotLike in IF operator (OC-1220)
* Fix RegExp in IF operator (OC-1219)
* Fix templates list during creating connection by template (OC-1218)
* Reference not Updated during migration (OC-1217)
* Add sorting in Connection and Schedules (OC-1216)
* Canonical names in application.yml file (OC-1214)
* Whitespace encode is not applied in url (OC-1209)
* Bug when exception occurred in JobExecutor class (OC-1208)
* Bug when running single Method XML (OC-1207)
* Wrong reference construction for XMLPath (OC-1206)
* Deny List doesn't take to account % and \n signs. (OC-1204)
* Bug When query param is not set or empty (OC-1203)
* Show full information for reference (OC-1185)
* Error when Comparing string that contains only digits. (OC-1173)
* Error when extracting direct reference (OC-1166)
* Template generated incorrectly in Support File. (OC-1165)
* Support enabling/disabling debug mode and improve UI feedback for missing logs. (OC-1135)
* Scheduler to investigate NoSuchFileException during execution. (OC-1134)
* Log structure changes (OC-1117)
* Create endpoint for Logs (OC-1116)
* Connector Partial Update (OC-1109)
* Master Password for Connector  (OC-1108)
*  Meta Information Requests (OC-1098)
* Unit Tests for Parsers & Trackers (OC-1092)
*  Implement Trackers for Scope Blocks (OC-1088)
* Track Execution Context (OC-1087)
* Implement Log Parsers (OC-1086)
* Implement Dispatcher (Router) (OC-1085)
* Define Core Interfaces (OC-1084)
* WebSocket Refactor (OC-1067)
* Template Migrator (OC-1066)
* Validate YAML changellog (OC-1061)
* Current scheduler is Empty (OC-1059)
* Disable Logging When Executing with Support File (OC-1049)
* Implement Support File Storage Limit per Connection (OC-1048)
* Add WebSocket Notification for Support File Creation (OC-1043)
* Handle Missing Connection in Support File (OC-1042)
* Enhance Support File Handling and WebSocket Notifications (OC-1039)
* Bug when execution connection with Masking (OC-1031)
* Support new and old structure in Operators. (OC-1030)
* Added ui object in Connection (OC-1029)
* Bug when Saving Connection (OC-1028)
* Extend/Improve Documentation (OC-1004)
* Manual Support File Download (OC-1002)
* Automatically Collect Support Files on Error (OC-1001)
* Infrastructure and Configuration of Support File (OC-1000)
* AllowList is not working with integers. (OC-999)
* GraphQL is not working (OC-996)
* Handle  old Direct References. (OC-995)
* Get All Responses of a Method. (OC-988)
* Operation body doesn't support ARRAY type. (OC-978)
* OperatorEnum Class (OC-976)
* Attached Files or Download Link (OC-974)
* Customizable Data Masking in Logs [Backend] (OC-950)
* GraphQL is missing when executing (OC-945)
* Fix category filter using paginator (OC-916)
* Check timeout in test connection execution (OC-915)
* Support new arrays from jsonPath (OC-912)
* Header/status/body in direct refs (OC-909)
* Extend if conditions with OR and AND operators in nested brackets [Frontend] (OC-906)
* Saving settings from connection editor in database (OC-905)
* Support Different Programming Languages [Backend] (OC-895)
* Support multiple fail and success responses  (OC-893)
* Remove zip and jar files  (OC-871)
* Log order is broken (OC-870)
* Content Type is not defined for hal+json (OC-867)
* set current item after remove item (OC-855)
* Optimize UI Logs in the Frontend for API Calls and Implement Lazy-Loading Structure (OC-845)
* Test Connection not removed (OC-835)
* Cascade delete when invoker removed (OC-793)
* "Undo" function for partial update/save  (OC-774)
* Api Converter for swagger 2.0 (OC-762)
* Merge with the backend (OC-742)
* Replace template during import (OC-694)
* Add group with image fails and missing update icon (OC-590)
* Implement an enhancement for webhook variables (OC-411)


4.6.1
========

:Date: October 31, 2025

Features
--------
* Implement endpoint for online services

Fixes
--------
*  Request Data not Updating (OC-1251)
*  Error during execution, wrong reference (OC-1245)
*  Replace themeSync value to onlince service status (OC-1250)


4.6
========

:Date: October 25, 2025

Features
--------
* UI-Logs
* Multi-Language support
* Smart Sync

Fixes
--------
*  Delete old log files by executionId (in case of dropping DB) (OC-1212)
*  Template generated incorrectly in Support File (OC-1165)
*  Fix link in Update Assistant (OC-1142)
*  Fix delete reference bug (OC-1070)
*  Fix hmac bug (OC-1097)
*  Fix enhancement for xml responses (OC-1104)
*  Test duplicate connection feature (OC-1107)
*  Saving an aggregator adds duplicate comments (OC-1119)
*  Fix InputSelect options bug (OC-1126)
*  Test duplicate connection feature (OC-1107)
*  Add wildcard property for reference generator (OC-1158)


4.5.1
========

:Date: August 22, 2025

Fixes
--------
*  Fix delete reference bug (OC-1197)
*  Invoker Sync does not work (OC-1192)
*  Fix error message (OC-1191)
*  Fix reference for param as an object (OC-1188)
*  Show full information for reference (OC-1185)
*  Integrate Copy to Clipboard button for Logs (OC-1184)
*  Error when Comparing string that contains only digits (OC-1173)
*  Fix dependency check during D&D for operators (OC-1171)
*  Update headers (OC-1170)
*  Error when extracting direct reference (OC-1166)
*  Template generated incorrectly in Support File (OC-1165)


4.5
========

:Date: June 6, 2025

Features
--------

* Support file generation
* Field mapping in the request header
* Operators with AND and OR support
* Connector setting protected by master password

Fixes
--------

* AllowList is not working with integers (OC-999)
* Check counter of the operation usage (OC-992)
* Saving an aggregator adds duplicate comments (OC-1119)
* API-Request body doesn't support ARRAY type (OC-978)
* Error: Enhancement Not Found (OC-998)


4.4
========

:Date: March 17, 2025

Features
--------

* Extra-Ops integration

Fixes
--------

* Triggers from old scheduler has disappeared (OC-964)
* Current scheduler is Empty (OC-1059)
* Fix bug with drag and drop in connection editor (OC-932)
* Error when downloading changelog.rst file (OC-920)
* GraphQL is missing when executing (OC-945)


4.3
========

:Date: February 14, 2025

Features
--------

* Security-Update! Backend routing through endpoint /api instead of port 9090
* i-doit OTRSC AddOn extended. Now supports KIX
* Package extension. DEB package now supports Apache2 web server

Fixes
--------

* Fixed a bug in pagination when property nextLink is missing (OC-963)
* Fixed a bug where AllowList is not working with integers (OC-999)
* Fixed a bug when reading MacAddress in license management (OC-994)
* Fixed a bug when opening api documentation in swagger (OC-1004)


4.2
========

:Date: November 19, 2024

Features
--------

* Licence Management integration
* LDAP Integration (AD and OpenLDAP)
* Multi-factor authentication with TOTP

Fixes
--------

* GraphQL is missing when executing (OC-945)
* Webhook Bug when executing Connection (OC-947)
* Error in pagination when property nextLink is missing (OC-963)
* Fix bug with drag and drop in connection editor (OC-932)
* Error when downloading changelog.rst file (OC-920)
* CHAR in property name(OC-948)


4.1
========

:Date: July 11, 2024

Features
--------

* Support of the paginator functionality
* Webhook GET and POST requests support for loop and if operators
* Grouping of connection and schedule entries
* Cancellation of an executed connection from the UI

Fixes
--------

* api operation is not saved when the request body is an array (OC-623)
* wrong data type in api operation (OC-625)
* field value is not loaded on the connector page (OC-629)
* URL is constructed incorrectly (OC-861)
* Type of Object is not correct (OC-868)
* Bug appeared when getting xml response from Ivanti (OC-751)


Major Relase :loudspeaker:
========


4.0
========

:Date: June 05, 2024

Features
--------

* MongoDB support
* Redesign of Update Assistant
* Quick connection generator
* Extend installation types to DEB, RPM, Docker and Ansible
* Data encryption of connector information


Fixes
--------

* Error appears when i tried to add an invoker (OC-631)
* operator regex is not supported (OC-796)
* Cant add a slack notification (OC-782)
* When we build payload we need take to account type and format of the fields and correspondingly create fields (OC-646)
* If an endpoint does not exist then throw corresponding exception (OC-712)
* Converter Add MimeType (OC-805)


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
* Connection Editor improvements:
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
* Dell Warranty Check
* StarFace
* Weclapp


Fixes
-----

* js error in developer tools (OC-483)
* clicking on external apps doesn't work (OC-533)
* themes from service portal are not synced to opencelium (OC-557)
* cant update a connection (OC-563)
* after login into opencelium a git error appears in logs (OC-565)
* waiting to long to get connections on frontend (OC-566)


Major Release :loudspeaker:
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
* Support multi-step authentication
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
* new frontend engine had some issues (OC-438)
* error during updating a connector (OC-439)

|
2.1
===
:Date: January 18, 2022

Features
--------

* Enable/disable logs for a job
* Duplicate connections
* Duplicate business templates
* Edit business templates

Fixes
-----

* Image is deleted (OC-425)
* API Operation didn't execute correctly with the fields defined in the invoker file (OC-417)
* Layout problems when deleting a connection (OC-419)
* Starting a job (OC-424)
* When you update a job, it is automatically activated (OC-423)


Major Release :loudspeaker:
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
* Wrong syntax generated on a query by using ref generator (OC-330)

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

* Execute several jobs doesn't work (OC-226)
* Connection get error via notification (OC-206)
* No kibana link was created after triggering a job (OC-189)
* Connection get error via notification (OC-189)
* Scheduler saving (OC-250)
* First execution job will not be updated on scheduler view (OC-225)


Major Release :loudspeaker:
============

|
1.0
===
:Date: February 1, 2020

Connector
---------

* i-doit
* Zabbix
* Icinga2
* OTRS/Znuny/OTOBO
