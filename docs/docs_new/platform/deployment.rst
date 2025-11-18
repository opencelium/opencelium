##################
Deployment
##################

.. contents::
   :local:

System Requirements
===================
The recommendations from ``docs_new/getting_started/requirements.rst`` remain valid
and are summarized here for quick reference:

- **Virtual hardware** – 2 vCPUs, 8 GB RAM, 50 GB disk.
- **Operating systems** – Debian 12, Ubuntu 24.04 LTS, SLES 15 SP5, or RHEL 9.
- **Software** – nginx 1.26, MongoDB 7.0, Java 17 (JDK), MariaDB 10.
- **Network** – expose frontend 80/443, backend 9090, socket 8082 if remote log
  streaming is required.

Installation on Debian/Ubuntu
=============================
The full walk-through stays in ``docs_new/getting_started/installation.rst``.  The
main steps are condensed below so they can be cross-referenced with automation.

#. Update the host and pull dependencies::

      apt update
      apt dist-upgrade
      apt install unzip mariadb-server mariadb-client openjdk-17-jdk nginx

#. Install MongoDB by following the vendor instructions and ensure ``mongod`` is
   enabled.
#. Download and unpack OpenCelium::

      wget --content-disposition "https://packagecloud.io/becon/opencelium/packages/anyfile/oc_latest.zip/download?distro_version_id=230" -P /opt/opencelium/
      unzip -o -d /opt/opencelium/ /opt/opencelium/oc_latest.zip
      rm /opt/opencelium/oc_latest.zip
      ln -s /opt/opencelium/scripts/oc_service.sh /usr/bin/oc
      chmod +x /usr/bin/oc

#. Configure MariaDB::

      systemctl restart mariadb
      systemctl enable mariadb
      mysql -u root -e "source /opt/opencelium/src/backend/database/oc_data.sql; GRANT ALL PRIVILEGES ON opencelium.* TO 'opencelium'@'localhost' IDENTIFIED BY 'secret1234'; FLUSH PRIVILEGES;"
      mysql_secure_installation

   Replace the example password and align with the ``spring.datasource`` block.
#. Configure MongoDB::

      systemctl restart mongod
      systemctl enable mongod
      mongosh --eval "db.getSiblingDB('opencelium').createUser({user: 'oc_admin', pwd: passwordPrompt(), roles: ['readWrite','dbAdmin' ]})"

#. Configure nginx (HTTP or HTTPS)::

      rm /etc/nginx/sites-enabled/default
      ln -s /opt/opencelium/conf/nginx.conf /etc/nginx/sites-enabled/oc.conf
      # or link nginx-ssl.conf and update certificate paths
      systemctl restart nginx
      systemctl enable nginx

#. Prepare ``application.yml`` by copying the default file and adapting database
   passwords, SSL properties, proxy settings, and optional LDAP/service portal
   sections::

      cp /opt/opencelium/src/backend/src/main/resources/application_default.yml \
         /opt/opencelium/src/backend/src/main/resources/application.yml

#. Wire the systemd service::

      ln -s /opt/opencelium/conf/opencelium.service /etc/systemd/system/opencelium.service
      systemctl daemon-reload
      systemctl enable opencelium
      systemctl start opencelium

Installation on SLES 15 SP5
===========================
The SLES instructions mirror the Debian steps with ``zypper`` commands (see the
end of ``docs_new/getting_started/installation.rst``):

#. Install prerequisites::

      zypper install unzip insserv mariadb mariadb-client java-17-openjdk nginx

#. Install MongoDB per vendor documentation.
#. Download and unpack the ``oc_latest.zip`` archive, link ``/usr/bin/oc``.
#. Configure MariaDB and MongoDB users exactly as shown for Debian.
#. Link the nginx configuration, choose HTTP or HTTPS, and reload the service.
#. Copy ``application_default.yml`` to ``application.yml`` and adjust secrets.
#. Register ``opencelium.service`` with ``insserv``/systemd and start it.

Post-install Checks
===================
- Access ``http://<host>`` and log in with the default credentials
  ``admin@opencelium.io`` / ``1234`` (change immediately).
- Tail backend logs via ``journalctl -xe -u opencelium -f`` when validating LDAP
  or invoker issues.
- Verify that the frontend can fetch ``/settings.json`` (served by nginx) so it
  can rewrite API/socket/Kibana URLs before bootstrapping React.
