.. _about-security:

################################################
Security & Coordinated Vulnerability Disclosure
################################################

Security and the protection of the people who use OpenCelium are a high
priority. The software and its dependencies are reviewed regularly, and
responsible, coordinated reports of vulnerabilities are welcome.

This page summarises the policy published at
`opencelium.io/security-coordinated-vulnerability-disclosure
<https://www.opencelium.io/security-coordinated-vulnerability-disclosure/>`_.
If the two ever differ, the website is authoritative.

.. contents::
   :local:

Report a vulnerability
======================

Send reports of possible vulnerabilities and other security-relevant problems
to:

.. centered:: **security@opencelium.io**

.. important::
   Please do **not** report vulnerabilities in public GitHub issues, community
   forums or other public channels. A private report gives the team time to
   investigate and, where needed, ship a security update before details become
   public.

Use this address only for security reports. General questions, support
requests and product inquiries go through the usual channels — see
`Support <https://www.opencelium.io/support/>`_ and
`Contact <https://www.opencelium.io/kontakt/>`_.

What to include
===============

The more technical detail a report contains, the faster it can be assessed.
As far as possible, include:

#. the affected OpenCelium version (shown on the :ref:`changelog page
   <start-guided-tours-changelog>` as *Installed version*),
#. the affected component or function,
#. a description of the vulnerability,
#. steps to reproduce it,
#. the expected and the actual behaviour,
#. the possible impact,
#. a proof of concept, if you have one,
#. relevant logs, screenshots or other technical information,
#. CVE, CWE or other references, if applicable,
#. how we can reach you for follow-up questions.

.. note::
   Do not send personal data, credentials or other confidential information
   that is not needed to analyse the problem. When you attach logs or
   screenshots of an OpenCelium instance, remove connector passwords, API keys,
   tokens and webhook URLs first — for example a :ref:`cURL export
   <guide-request-playground-curl>` contains real credentials.

How reports are handled
=======================

* Please give OpenCelium the opportunity to investigate the report and take
  appropriate action first.
* Reports are treated confidentially. The information is used only to
  investigate, assess and fix the reported issue, and for the related security
  and compliance processes.

Coordinated disclosure
======================

The goal is coordinated disclosure: technical details are published in a way
that gives users enough time to install the available security updates or take
other protective measures.

Do not publish detailed information or proof-of-concept code for a
vulnerability that is not yet fixed before the next steps have been agreed with
OpenCelium.

Supported versions
==================

Which versions are currently supported, and for how long they receive security
fixes, is published on the OpenCelium website and in the release and product
information. Security updates are provided for supported versions where this is
necessary for the version and the issue and technically feasible.

To find out what each release changed, open the in-app **Changelog** page or
the `changelog on GitHub
<https://github.com/opencelium/opencelium/blob/prod/CHANGELOG.rst>`_; how to
install an update is described in :doc:`../operations/updating`.

Security advisories
===================

Fixed and published vulnerabilities are announced through the official
OpenCelium channels where public disclosure is possible and sensible. Where
available and appropriate, an advisory contains:

* the affected OpenCelium versions,
* the fixed versions,
* a description of the vulnerability,
* its severity and impact,
* a CVE reference, if one exists,
* remediation information,
* the actions users need to take.

Contact
=======

:Security reports: security@opencelium.io
:General enquiries: info@opencelium.io · +49 (0) 89 608668-10
:Address: OpenCelium GmbH, Hauptstraße 8b, 82008 Unterhaching, Germany
