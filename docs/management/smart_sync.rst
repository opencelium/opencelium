.. _management-smart_sync:

##########
Smart Sync
##########


The **Smart Sync** feature provides a direct connection between the OpenCelium Service Portal and a local OpenCelium instance.  
It allows **Templates** and **Invoker** objects to be synchronized automatically without manual downloads or uploads.


Overview
==================

The OpenCelium Service Portal is a SaaS platform available for subscription users, providing:

- Pre-built Templates and Invoker objects  
- Product updates and release information  
- Integrated ticket system for support and feedback  
- Download area for the latest versions  

**Smart Sync** enables:

1. **Direct Portal Connection**  
   After a one-time authentication, the system automatically synchronizes Templates and Invokers.  

2. **Automatic & Manual Sync**  
   - Automatic: scheduled via cron expression  
   - Manual: triggered via the UI sync button  

3. **Version Control & Conflict Handling**  
   Local modifications are checked before overwriting content.  

4. **Immediate Availability**  
   New or updated Templates and Invokers are immediately available in the UI after sync.


Configuration
==================

The synchronization behavior can be configured in the backend settings (`application.yml`):

.. code-block:: yaml

   online-services:
     invoker-sync:
       # Cron expression for automatic invoker sync
       time: 0 0 0 * * *
       # Enable or disable automatic invoker sync
       active: "false"
     template-sync:
       # Cron expression for automatic template sync
       time: 0 0 0 * * *
       # Enable or disable automatic template sync
       active: "false"
     # Master switch for the online services
     active: "false"

**Notes:**

- The `time` field uses standard cron syntax to define automatic sync schedules.  
- The `active` flags control whether the sync is enabled for invokers, templates, or both.  
- If the master `online-services.active` is set to `"false"`, all online syncing is disabled regardless of the individual flags.
