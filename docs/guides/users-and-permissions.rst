#########################
Users and permissions
#########################

.. contents::
   :local:

Permissions are granted per **role**, never per user. A user gets exactly the
rights of their role. The component and action matrix is in
:doc:`../reference/permissions`.

.. note::
   Up to 5.1 the interface called roles **groups**. The API and the command
   palette have always called them ``role``.

Create a role first
===================

**Users & Access → Roles → Create**. Two steps:

* **Role Details** — name (mandatory), description, optional icon. *(5.2: the
  icon is uploaded and cropped round in the wizard, and shown in the role list.)*
* **Permissions** — select the components the role may touch, then tick the
  actions per component. At least one is required; the *admin* column ticks a whole
  row.

A role named **admin** (in any letter case) also gets the guided tours, see
:doc:`../start/guided-tours`.

.. image:: ../img/admin5/OC5_role-list.png
   :align: center
   :width: 1000

Effect in the interface: missing **READ** hides a component's menu entry
altogether; missing CREATE/UPDATE/DELETE hides only those actions. The command
palette follows the same rules.

Then create users
=================

**Users & Access → Users → Create**. Three steps:

* **User Details** — title, name, surname, department, organization, phone, and
  the profile picture.
* **Credentials** — e-mail (the username, max 255 characters) and password
  (at least 8 characters).
* **Role** — the role.

.. image:: ../img/admin5/OC5_user-list.png
   :align: center
   :width: 1000

.. note::
   The signed-in user cannot delete themselves.

Profile pictures
================

.. note::
   **New in 5.2.**

The picture tile in the user wizard — and on everyone's own **Profile** page —
uploads a PNG or JPG of up to 10 MB, crops it to a circle, replaces or deletes it.
The picture appears in the user list and on the profile icon in the top bar.

When you leave the e-mail field, OpenCelium checks whether the address has a
`Gravatar <https://gravatar.com>`_ and, if so, asks *Use Gravatar picture?*.
For a user who already has a picture, the Gravatar replaces it on Save. Once a
Gravatar is known, the tile also offers **Refresh from Gravatar**.

The Gravatar lookup needs online services switched on
(:ref:`ref-config-online-services`) and the application served over HTTPS (or
``localhost``); otherwise it simply does not appear. Nothing is sent to Gravatar
when it is off.

Two-factor authentication
=========================

Toggle 2FA per user in the **2FA** column of the user list, or for several users at
once by selecting them and using **Enable 2FA**.

At the next login the user scans the QR code with an authenticator app, then enters
the generated code as a second step.

LDAP
====

For central user management, configure ``spring.security.ldap`` — see
:ref:`ref-configuration`. Users then sign in with their directory credentials, and
``group-role-mapping`` maps directory groups onto OpenCelium roles, with
``default-role`` as the fallback.

Test it under **Users & Access → LDAP Check**, which shows the effective
configuration and the test log.

.. image:: ../img/admin5/OC5_ldap-check.png
   :align: center
   :width: 1000

.. warning::
   In 5.0 this block is ``spring.security.ldap``. Before 5.0 it was
   ``spring.data.ldap``. An unchanged 4.x file silently stops authenticating.

For failures, raise ``logging.level.org.springframework.security.ldap`` to
``DEBUG`` and watch ``journalctl -xe -u opencelium -f``.

Passwords
=========

Users change their own password in the profile dialog; it logs them out
immediately.

A forgotten password is reset from the sign-in page, which mails a reset link. The
new password needs at least 8 characters with an uppercase letter, a lowercase
letter, a number and a special character. (5.2 dropped the old 16-character cap
in the browser.) This requires ``spring.mail`` to be configured —
without it the page says password reset is unavailable.

Sessions
========

A ``401`` or ``403`` signs the user out automatically, closes open dialogs, and
remembers the route so they return to it after signing in again.
