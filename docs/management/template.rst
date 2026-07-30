.. _management-business_template:

##################
Workflow Templates
##################

A **workflow template** is a stored workflow configuration that is reused to
create new workflows quickly. Templates were called *business templates* before
5.0; the admin screen is now **Configurations → Workflow Templates** and the
command-palette name is ``workflow-template``.

Templates can be managed from the UI and directly on the server. Let us consider
the use cases.

Getting a template into OpenCelium
""""""""""""""""""""""""""""""""""

**From the workflow editor.** Open the workflow you want to keep, then choose
**Save as Template** in the header menu and provide a name. Everything the
workflow contains — all steps with their connectors, operators, references and
enhancements — is stored with it.

Since 5.0 each method in a template also carries the **name of its invoker**
(``methods[i].connector.invoker``). That is what makes a template portable
between environments, where connector IDs mean nothing.

**By upload.** Go to **Configurations → Workflow Templates** and upload a
template file in ``json`` format. The same upload is available:

* from the **Load Template** dialog in the workflow editor, and
* from the command palette with ``upload workflow-template``.

Templates can also be uploaded as a ZIP archive containing several files.

**Via the server.** Copy the ``json`` file into

.. code-block::

   src/backend/src/main/resources/templates

The file is picked up by the system automatically.

Downloading a template
""""""""""""""""""""""

Templates are downloaded as ``json``:

* from **Configurations → Workflow Templates** with the download icon of a row,
* from the workflow list with **Download as template** on a row,
* from the workflow editor header menu with **Download as Template** (enabled
  once the workflow has been saved),
* from **Version History**, to download one specific version as a template,
* from the command palette with
  ``download workflow-template by templateId <id>`` or
  ``download workflow-template by name <name>``.

Using a template
""""""""""""""""

Open the workflow editor and choose **Load Template** from the header menu, then
select the template. Its short description is shown before you apply it.

.. warning::
   Loading a template replaces all current changes in the editor. If the
   workflow already has a title and a description, you are asked whether those
   should be replaced too; they are applied silently only when both are still
   empty.

.. note::
   The *Expert* / *Template* mode choice of the old connection wizard no longer
   exists. In 5.0 you always start from the editor and load a template into it
   if you want one.

Mapping the template's connectors
=================================

A template created in another environment references connectors that do not
exist here. In that case the **Map template connectors** dialog opens and asks
which connector of *this* environment each one should use. For every entry it
shows the invoker hint and the methods that use that connector, and it lets you
create a missing connector on the spot.

Upgrading a template
""""""""""""""""""""

The internal structure of templates has changed several times across versions.
Older templates are converted so they can still be used:

* On the **Workflow Templates** page you can upgrade a single template with its
  convert icon, or convert all of them at once.
* When a template of an older version is offered in the editor, it is marked
  with the conversion icon; converting it makes it usable.

For 5.0 the conversion to the new multi-connector layout happens **on the read
path, in memory** — the stored template file is not rewritten until it is saved
again. See :ref:`usage-workflow-migration`.

Changing a template
"""""""""""""""""""

There is no way to edit a template's content in the UI. You can change the
``json`` file on the server in ``src/backend/src/main/resources/templates``, but
this is strongly discouraged: a small mistake (JSON syntax, a logic error, the
wrong encoding) breaks loading the template in the editor. Prefer loading the
template, editing the workflow, and saving it as a new template.

Deleting a template
"""""""""""""""""""

Templates are deleted on the **Configurations → Workflow Templates** page, with
the delete action of a row or as a bulk action for several selected rows. The
command palette offers ``delete workflow-template by templateId <id>`` and
``delete workflow-template by name <name>``.
