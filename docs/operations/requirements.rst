############
Requirements
############

We recommend using the following setup:

**Virtual Hardware:**

- 2 vCPUs
- 8 GB RAM
- 50 GB disc space

**Software:**

- nginx 1.26.0 https://nginx.org/en/download.html (stable version)
- mongodb 7.0.5 https://www.mongodb.com/download-center/community/releases 
- java 17 (jdk) https://www.oracle.com/technetwork/java/javase/downloads/index.html
- mariadb 10 (lts) https://mariadb.com/kb/en/mariadb-server-release-dates/ 

**Operating System:**

- Debian GNU/Linux 12 "Bookworm"
- Ubuntu 24.04 LTS "Noble Numbat"
- SUSE Linux Enterprise Server (SLES) 15 SP5
- Red Hat Enterprise Linux (RHEL) 9


**Network config:**

- open frontend 80 / 443 (SSL)
- open backend 9090

.. note::
   The hardware and software requirements are unchanged in 5.0 — it still runs on
   Java 17.

   5.0 does make more use of the WebSocket channel than earlier versions: the
   workflow test run, the live dashboard metrics and the support-log
   notifications all depend on it. The backend serves it under ``/ws`` on the
   same port, so no additional port has to be opened, but a reverse proxy in
   front of OpenCelium must proxy ``/ws`` with the ``Upgrade`` headers. The
   shipped ``conf/nginx_default.conf`` already does this.

**Browser:**

- A current version of Chrome, Edge, Firefox or Safari. The frontend is an
  ES-module build and does not support Internet Explorer.
