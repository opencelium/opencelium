######################
OpenCelium 5.0
######################

OpenCelium is an integration platform: you connect APIs, move and enrich data
between them, and control the whole flow from a browser.

This documentation is organised by what you are trying to do.

**New here?** Start with :doc:`start/introduction` for the ideas, then
:doc:`start/first-workflow` builds a working integration end to end.

**Upgrading from 4.x?** Read :doc:`start/upgrade-to-5` first — workflows replaced
connections, and two ``application.yml`` keys moved.

**Looking for how to do one specific thing?** The *How-to guides* in the sidebar
are task-oriented recipes; :doc:`guides/build-a-workflow` is the usual entry
point.

**Need exact values, fields or endpoints?** The *Reference* section has them —
for example :doc:`reference/configuration` and :doc:`reference/api`.

**Running the server?** See :doc:`operations/requirements` and
:doc:`operations/updating`.

.. toctree::
   :caption: Get started
   :maxdepth: 2

   start/introduction
   start/install
   start/first-workflow
   start/upgrade-to-5

.. toctree::
   :caption: Concepts
   :maxdepth: 2

   concepts/workflow-model
   concepts/connectors-and-invokers
   concepts/data-mapping
   concepts/execution

.. toctree::
   :caption: How-to guides
   :maxdepth: 2

   guides/build-a-workflow
   guides/branch-and-loop
   guides/call-any-api
   guides/chain-workflows
   guides/schedule-and-notify
   guides/debug-a-workflow
   guides/reuse-with-templates
   guides/users-and-permissions
   guides/configure-the-system

.. toctree::
   :caption: Reference
   :maxdepth: 2

   reference/screens
   reference/command-palette
   reference/operators
   reference/configuration
   reference/permissions
   reference/shortcuts
   reference/api

.. toctree::
   :caption: Operations
   :maxdepth: 2

   operations/requirements
   operations/install-packages
   operations/updating
   operations/backup-and-restore
   operations/monitoring
   operations/troubleshooting

.. toctree::
   :caption: Integrations
   :maxdepth: 2

   integrations/idoit
   integrations/otrs
   integrations/db2api
   integrations/csv2api

.. toctree::
   :caption: About
   :maxdepth: 1

   about/license
   about/sources

.. toctree::
   :caption: Elsewhere
   :maxdepth: 1

   Website <https://opencelium.io>
   Service Portal (subscribers) <https://service.opencelium.io>
   Video tutorials <https://www.youtube.com/playlist?list=PLh_5t7kd2fySIqh6XxCB94lGXvU5lXbQ4>
   Webinars <https://www.youtube.com/playlist?list=PLh_5t7kd2fyScueyWSRhOn16acRFEBmgO>
   Downloads <https://packagecloud.io/becon/opencelium/>
   Source <https://github.com/opencelium/opencelium/>
