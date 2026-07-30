##################
Login
##################

.. contents::
   :local:

Signing in
""""""""""

After launching the application in your browser you see the login page. It asks
for your e-mail address and your password; the e-mail address serves as the
username. The eye icon in the password field toggles between showing and hiding
what you type.

The default admin user has the following credentials:

   * **login:** admin@opencelium.io
   * **password:** 1234

If the credentials are wrong you get *Invalid email or password*; if the backend
cannot be reached you get *Could not reach the server. Please try again.* — the
two cases are reported separately, so a network problem is not mistaken for a
wrong password.

Two-factor authentication
"""""""""""""""""""""""""

If two-factor authentication is enabled for your user, a second step asks for the
code from your authenticator app. When you set 2FA up for the first time, the
page shows the QR code to scan, or the secret to enter manually. An invalid or
expired code can simply be retried.

2FA is enabled per user in **Users & Access → Users**.

Forgot password
"""""""""""""""

New in 5.0: **Forgot password?** on the login page leads to a form where you
enter the e-mail address of your account. OpenCelium then sends you an e-mail
with a link to reset your password.

.. note::
   Password reset needs a working mail server. If none is configured, the page
   reports *Password reset is not available yet. Please contact your
   administrator.* You can check the mail server status under
   :ref:`admin_panel-system_check`.

The link in the e-mail opens the **Set new password** page. The new password must

* be between 8 and 16 characters long,
* contain an uppercase letter,
* contain a lowercase letter,
* contain a number,
* contain a special character,

and has to be repeated identically. After a successful reset you are redirected
to the login page automatically, with a visible countdown.

Session handling
""""""""""""""""

If the backend answers a request with ``401`` or ``403``, you are signed out
automatically and told why. The route you were on is remembered: after signing
in again you land back where you were. An intentional sign-out always lands on
the start page. Dialogs that are open when the session expires are closed, so no
form is left in a half-authenticated state.

After signing in
""""""""""""""""

You arrive at the :doc:`dashboard`, with the navigation on the left. The main
menu gives direct access to:

   * Dashboard
   * Connectors
   * Workflows
   * Schedules

Administrative screens live in the second, admin menu — switch to it with the
switcher at the top of the sidebar or with ``Alt+M``. See :doc:`admin` for its
contents.

Entries you have no read permission for are not shown.

Please see the next sections for a general overview of the application and its
usage. :doc:`command_palette` describes how to reach any of these screens by
typing instead of clicking.
