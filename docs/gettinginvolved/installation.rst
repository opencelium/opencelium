##################
Installation
##################

.. note::
	Please check the software requirements, before installing OC.

Debian/Ubuntu (example for 24.04 LTS)
"""""""""""""""""

Prepare environment
==================

**1. Update:**

Update your system, download and install required packages.

.. code-block:: sh
	:linenos:

	apt update
	apt dist-upgrade
	apt install unzip mariadb-server mariadb-client openjdk-17-jdk nginx

**2. Install MongoDB:**

| Use default MongoDB installation guide.
| You can find documentation here: `MongoDB Installation <https://www.mongodb.com/docs/manual/administration/install-on-linux/>`_
	
	
Install Application
==================

Download and unzip application, and create a link for it.

.. code-block:: sh
	:linenos:

	wget --content-disposition "https://packagecloud.io/becon/opencelium/packages/anyfile/oc_latest.zip/download?distro_version_id=230" -P /opt/opencelium/
	unzip -o -d /opt/opencelium/ /opt/opencelium/oc_latest.zip
	rm /opt/opencelium/oc_latest.zip
	ln -s /opt/opencelium/scripts/oc_service.sh /usr/bin/oc
	chmod +x /usr/bin/oc
		
Configuration
==================

**1. MariaDB:**

Create database and mysql user for OpenCelium, enable mysql service and secure mysql installation.

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh
	:linenos:
	
	systemctl restart mariadb
	systemctl enable mariadb
	mysql -u root -e "source /opt/opencelium/src/backend/database/oc_data.sql; GRANT ALL PRIVILEGES ON opencelium.* TO 'opencelium'@'localhost' IDENTIFIED BY 'secret1234'; FLUSH PRIVILEGES;"
	mysql_secure_installation
	
**2. MongoDB:**

Start and enable mongod service and create a user for Opencelium.

.. code-block:: sh
	:linenos:
	
	systemctl restart mongod
	systemctl enable mongod
	mongosh --eval "db.getSiblingDB('opencelium').createUser({user: 'oc_admin', pwd: passwordPrompt(), roles: ['readWrite','dbAdmin' ]})"

**3. Nginx:**

Remove default config and link configuration file for OpenCelium.

.. code-block:: sh
	:linenos:
	
	rm /etc/nginx/sites-enabled/default
	ln -s /opt/opencelium/conf/nginx.conf /etc/nginx/sites-enabled/oc.conf
	
.. note::
	If you like to use SSL, copy the SSL-configuration file for OpenCelium:
	
	.. code-block:: sh
		:linenos:
	
		rm /etc/nginx/sites-enabled/default
		ln -s /opt/opencelium/conf/nginx-ssl.conf /etc/nginx/sites-enabled/oc.conf
		
	and change the certificates within the config (/opt/opencelium/conf/nginx-ssl.conf), with your own:	
			
	.. code-block:: sh
		:linenos:	
	
		ssl_certificate /etc/ssl/certs/opencelium.pem;
		ssl_certificate_key /etc/ssl/private/opencelium.key;
		
Reload config and enable nginx.

.. code-block:: sh
	:linenos:
	
	systemctl restart nginx
	systemctl enable nginx
	
**4. OpenCelium:**

Create and adjust configuration.

.. code-block:: sh
	:linenos:
	
	cp /opt/opencelium/src/backend/src/main/resources/application_default.yml /opt/opencelium/src/backend/src/main/resources/application.yml
	
	
.. note::
	| Modify application.yml
	| Within section "Database configuration section of MariaDB and MongoDB":
	| - change password of opencelium user for MariaDB (default "secret1234")
	| - change password of oc_admin user for MongoDB in uri line (default "secretsecret")

	| Just in case you are using SSL, add certs to the ssl section. 
	| It has to be a p12 keystore file with password! 
	| If you just have key and pem you can create a p12 as follows:

	
	.. code-block:: sh
		:linenos:
		
		openssl pkcs12 -export -out /opt/opencelium/src/backend/src/main/resources/opencelium.p12 -in /etc/ssl/certs/opencelium.pem -inkey /etc/ssl/private/opencelium.key
	
Finally start OpenCelium backend.	
	
.. code-block:: sh
	:linenos:
	
	ln -s /opt/opencelium/conf/opencelium.service /etc/systemd/system/opencelium.service
	systemctl daemon-reload
	systemctl enable opencelium
	systemctl start opencelium

.. note::
	| Afterwards you can connect to `http://localhost`	
	| Default User and Password is:
	
	| admin@opencelium.io
	| 1234
	
	| If you want to have a look into OpenCelium Logs please use:
	
	.. code-block:: sh
		:linenos:
		
		journalctl -xe -u opencelium -f
		

SUSE Linux Enterprise Server (example for SLES 15 SP5)
"""""""""""""""""

Prepare environment
==================

**1. Update:**

Update your system, download and install required packages.

.. code-block:: sh
	:linenos:

	zypper install unzip insserv mariadb mariadb-client java-17-openjdk nginx

**2. Install MongoDB:**

| Use default MongoDB installation guide.
| You can find documentation here: `MongoDB Installation <https://www.mongodb.com/docs/manual/administration/install-on-linux/>`_

	
Install Application
==================

Download and unzip application, and create a link for it.

.. code-block:: sh
	:linenos:

	wget --content-disposition "https://packagecloud.io/becon/opencelium/packages/anyfile/oc_latest.zip/download?distro_version_id=230" -P /opt/opencelium/
	unzip -o -d /opt/opencelium/ /opt/opencelium/oc_latest.zip
	rm /opt/opencelium/oc_latest.zip
	ln -s /opt/opencelium/scripts/oc_service.sh /usr/bin/oc
	chmod +x /usr/bin/oc
		
Configuration
==================

**1. MariaDB:**

Create database and mysql user for OpenCelium, enable mysql service and secure mysql installation.

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh
	:linenos:

	systemctl restart mariadb	
	systemctl enable mariadb
	mysql -u root -e "source /opt/opencelium/src/backend/database/oc_data.sql; GRANT ALL PRIVILEGES ON opencelium.* TO 'opencelium'@'localhost' IDENTIFIED BY 'secret1234'; FLUSH PRIVILEGES;"
	mysql_secure_installation
	
**2. MongoDB:**

Start and enable mongod service and create a user for Opencelium.

.. code-block:: sh
	:linenos:
	
	systemctl restart mongod
	systemctl enable mongod
	mongosh --eval "db.getSiblingDB('opencelium').createUser({user: 'oc_admin', pwd: passwordPrompt(), roles: ['readWrite','dbAdmin' ]})"
	
**3. Nginx:**

Copy the configuration file for OpenCelium.

.. code-block:: sh
	:linenos:
	
	ln -s /opt/opencelium/conf/nginx.conf /etc/nginx/conf.d/oc.conf
	
.. note::
	If you like to use SSL, copy the SSL-configuration file for OpenCelium:
	
	.. code-block:: sh
		:linenos:
	
		ln -s /opt/opencelium/conf/nginx-ssl.conf /etc/nginx/conf.d/oc.conf
		
	and change the certificates within the config (/opt/opencelium/conf/nginx.conf), with your own:	
			
	.. code-block:: sh
		:linenos:	
	
		ssl_certificate /etc/ssl/certs/opencelium.pem;
		ssl_certificate_key /etc/ssl/private/opencelium.key;
		
Reload config and enable nginx.

.. code-block:: sh
	:linenos:
	
	systemctl restart nginx
	systemctl enable nginx
	
	
**4. Firewall:**	

Create firewall rules for Opencelium:

.. code-block:: sh
	:linenos:
	
	firewall-cmd --permanent --add-service=http
	firewall-cmd --permanent --add-service=https
	firewall-cmd --permanent --add-port=9090/tcp
	systemctl restart firewalld.service
	
**5. OpenCelium:**

Create and adjust configuration.

.. code-block:: sh
	:linenos:
	
	cp /opt/opencelium/src/backend/src/main/resources/application_default.yml /opt/opencelium/src/backend/src/main/resources/application.yml
	
	
.. note::
	| Modify application.yml
	| Within section "Database configuration section of MariaDB and MongoDB":
	| - change password of opencelium user for MariaDB (default "secret1234")
	| - change password of oc_admin user for MongoDB in uri line (default "secretsecret")

	| Just in case you are using SSL, add certs to the ssl section. 
	| It has to be a p12 keystore file with password! 
	| If you just have key and pem you can create a p12 as follows:

	
	.. code-block:: sh
		:linenos:
		
		openssl pkcs12 -export -out /opt/opencelium/src/backend/src/main/resources/opencelium.p12 -in /etc/pki/tls/certs/opencelium.pem -inkey /etc/pki/tls//private/opencelium.key
	
Finally start OpenCelium backend.	
	
.. code-block:: sh
	:linenos:
	
	ln -s /opt/opencelium/conf/opencelium.service /etc/systemd/system/opencelium.service
	systemctl daemon-reload
	systemctl enable opencelium
	systemctl start opencelium

.. note::
	| Afterwards you can connect to `http://localhost`	
	| Default User and Password is:
	
	| admin@opencelium.io
	| 1234
	
	| If you want to have a look into OpenCelium Logs please use:
	
	.. code-block:: sh
		:linenos:
		
		journalctl -xe -u opencelium -f
		

Red Hat Enterprise Linux (example for Red Hat 9.2)
"""""""""""""""""

Prepare environment
==================

**1. Update:**

Update your system, download and install required packages.

.. code-block:: sh
	:linenos:

	yum update
	yum install unzip mariadb-server java-17-openjdk nginx

**2. Install MongoDB:**

| Use default MongoDB installation guide.
| You can find documentation here: `MongoDB Installation <https://www.mongodb.com/docs/manual/administration/install-on-linux/>`_

	
Install Application
==================

Download and unzip application, and create a link for it.

.. code-block:: sh
	:linenos:

	wget --content-disposition "https://packagecloud.io/becon/opencelium/packages/anyfile/oc_latest.zip/download?distro_version_id=230" -P /opt/opencelium/
	unzip -o -d /opt/opencelium/ /opt/opencelium/oc_latest.zip
	rm /opt/opencelium/oc_latest.zip
	ln -s /opt/opencelium/scripts/oc_service.sh /usr/bin/oc
	chmod +x /usr/bin/oc
		
Configuration
==================

**1. MariaDB:**

Create database and mysql user for OpenCelium, enable mysql service and secure mysql installation.

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh
	:linenos:
	
	systemctl restart mariadb
	systemctl enable mariadb
	mysql -u root -e "source /opt/opencelium/src/backend/database/oc_data.sql; GRANT ALL PRIVILEGES ON opencelium.* TO 'opencelium'@'localhost' IDENTIFIED BY 'secret1234'; FLUSH PRIVILEGES;"
	mysql_secure_installation
	
**2. MongoDB:**

Start and enable mongod service and create a user for Opencelium.

.. code-block:: sh
	:linenos:
	
	systemctl restart mongod
	systemctl enable mongod
	mongosh --eval "db.getSiblingDB('opencelium').createUser({user: 'oc_admin', pwd: passwordPrompt(), roles: ['readWrite','dbAdmin' ]})"
	
**3. Nginx:**

Copy the configuration file for OpenCelium.

.. code-block:: sh
	:linenos:
	
	ln -s /opt/opencelium/conf/nginx.conf /etc/nginx/conf.d/oc.conf
	
.. note::
	If you like to use SSL, copy the SSL-configuration file for OpenCelium:
	
	.. code-block:: sh
		:linenos:
		
		ln -s /opt/opencelium/conf/nginx-ssl.conf /etc/nginx/conf.d/oc.conf
		ln -s /etc/pki/tls/private/ /etc/ssl/private
		
	Change the certificates within the config (/opt/opencelium/conf/nginx.conf), with your own:
	
	.. code-block:: sh
		:linenos:
		
		ssl_certificate /etc/ssl/certs/opencelium.pem;
		ssl_certificate_key /etc/ssl/private/opencelium.key;
		
Reload config and enable nginx.

.. code-block:: sh
	:linenos:
	
	systemctl restart nginx
	systemctl enable nginx
	
**4. Firewall:**	

Create firewall rules for Opencelium:

.. code-block:: sh
	:linenos:
	
	firewall-cmd --permanent --add-service=http
	firewall-cmd --permanent --add-service=https
	firewall-cmd --permanent --add-port=9090/tcp
	systemctl restart firewalld.service
		
**5. OpenCelium:**

Create and adjust configuration.

.. code-block:: sh
	:linenos:
	
	cp /opt/opencelium/src/backend/src/main/resources/application_default.yml /opt/opencelium/src/backend/src/main/resources/application.yml
	
	
.. note::
	| Modify application.yml
	| Within section "Database configuration section of MariaDB and MongoDB":
	| - change password of opencelium user for MariaDB (default "secret1234")
	| - change password of oc_admin user for MongoDB in uri line (default "secretsecret")


	| Just in case you are using SSL, add certs to the ssl section. 
	| It has to be a p12 keystore file with password! 
	| If you just have key and pem you can create a p12 as follows:

	
	.. code-block:: sh
		:linenos:
		
		openssl pkcs12 -export -out /opt/opencelium/src/backend/src/main/resources/opencelium.p12 -in /etc/pki/tls/certs/opencelium.pem -inkey /etc/pki/tls//private/opencelium.key
	
Finally start OpenCelium backend.	
	
.. code-block:: sh
	:linenos:
	
	ln -s /opt/opencelium/conf/opencelium.service /etc/systemd/system/opencelium.service
	systemctl daemon-reload
	systemctl enable opencelium
	systemctl start opencelium

.. note::
	| Afterwards you can connect to `http://localhost`	
	| Default User and Password is:
	
	| admin@opencelium.io
	| 1234
	
	| If you want to have a look into OpenCelium Logs please use:
	
	.. code-block:: sh
		:linenos:
		
		journalctl -xe -u opencelium -f
		
Ansible
"""""""""""""""""

.. note::
	Currently in rework.
	

Docker Compose
"""""""""""""""""

.. warning:: 

	We currently do not support Docker environments in productive use. 
	We recommend using it for use in a test phase!

.. note::
	You need at least 4 GB of RAM to run the containers. We recommend 8GB for a better performance.

Docker is a container-based software framework for automating deployment of 
applications. Compose is a tool for defining and running multi-container Docker 
applications.

This repo is meant to be the starting point for somebody who likes to use 
dockerized multi-container OpenCelium in production. The OpenCelium Docker image uses 
the stable branch of OpenCelium's Git repo.

The Docker images are hosted on `Dockerhub <https://hub.docker.com/u/opencelium>`_.

**Install Docker Environment:**

1. Install Docker:

Use default Docker installation guide.

   * `Docker Engine <https://docs.docker.com/engine/installation/>`_
   * `Docker Compose <https://docs.docker.com/compose/install/>`_

2. Getting started with opencelium-docker-compose:

.. code-block:: sh
	:linenos:

	git clone https://github.com/opencelium/opencelium-docker.git 
	cd opencelium-docker

.. note::
	We recommend to use always the latest tag version.

3. Start OpenCelium using DockerHub images

.. code-block:: sh
	:linenos:

	docker-compose up -d


DEB package for Ubuntu 24.04 LTS
"""""""""""""""""

.. warning:: 

	| We currently do not support deb package installations in productive use. 
	| We recommend using it for use in a test phase on a clean system!

Prepare environment:
==================

**1. Update Ubuntu system:**

.. code-block:: sh
	:linenos:

	apt update
	apt dist-upgrade
	apt install curl gnupg

**2. Install MongoDB:**

| Use default MongoDB installation guide.
| You can find documentation here: `MongoDB Installation <https://www.mongodb.com/docs/manual/administration/install-on-linux/>`_
	

Install Application:
==================

**1. Install deb package for OpenCelium:**

.. code-block:: sh
	:linenos:

	curl -s https://packagecloud.io/install/repositories/becon/opencelium/script.deb.sh | sudo bash
	sed -i 's!deb .*!deb [signed-by=/etc/apt/keyrings/becon_opencelium-archive-keyring.gpg] https://packagecloud.io/becon/opencelium/ubuntu noble main!' /etc/apt/sources.list.d/becon_opencelium.list
	apt update
	apt install -y opencelium
	
.. note::
	| Afterwards you can connect to `http://localhost`	
	| Default User and Password is:
	
	| admin@opencelium.io
	| 1234
	
	| If you want to have a look into OpenCelium Logs please use:
	
	.. code-block:: sh
		:linenos:
		
		journalctl -xe -u opencelium -f
		

Configure environment (optional):
==================

**1. Secure MySql and set root password (only for new MySql installations):**

.. code-block:: sh
	:linenos:

	mysql_secure_installation
	
**2. Change user passwords for MySQL and MongoDB:**

.. note::
	Please change the passwords (secret1234, secretsecret) in the following command lines!

.. code-block:: sh
	:linenos:

	mysql -u root -p -e "ALTER USER 'opencelium'@'localhost' IDENTIFIED BY 'secret1234';"
	mongosh --eval "db.getSiblingDB('opencelium').changeUserPassword('oc_admin', 'secretsecret')"

**3. Modify application.yml file for backend:**

.. code-block:: sh
	:linenos:

	cd /opt/opencelium/src/backend/src/main/resources

.. note::
	| Make changes inside the file application.yml! 
	| Change your MongoDB and MySQL database passwords.

**4. Restart Opencelium Backend:**

.. code-block:: sh
	:linenos:
	
	systemctl restart opencelium



RPM package for SUSE Linux Enterprise Server 15 SP5
"""""""""""""""""

.. warning:: 

	| We currently do not support rpm package installations in productive use. 
	| We recommend using it for use in a test phase on a clean system!

Prepare environment:
==================

**1. Update SLES system:**

.. code-block:: sh
	:linenos:

	zypper refresh
	zypper update
	
**2. Install MongoDB:**

| Use default MongoDB installation guide.
| You can find documentation here: `MongoDB Installation <https://www.mongodb.com/docs/manual/administration/install-on-linux/>`_
	

Install Application:
==================

**1. Install deb package for OpenCelium:**

.. code-block:: sh
	:linenos:

	curl -s https://packagecloud.io/install/repositories/becon/opencelium/script.rpm.sh | sudo bash
	sed -i 's!baseurl=.*!baseurl=https://packagecloud.io/becon/opencelium/sles/15.5/x86_64!' /etc/zypp/repos.d/becon_opencelium.repo
	zypper install -y OpenCelium
	
.. note::
	| Afterwards you can connect to `http://localhost`	
	| Default User and Password is:
	
	| admin@opencelium.io
	| 1234
	
	| If you want to have a look into OpenCelium Logs please use:
	
	.. code-block:: sh
		:linenos:
		
		journalctl -xe -u opencelium -f
		

Configure environment (optional):
==================

**1. Secure MySql and set root password (only for new MySql installations):**

.. code-block:: sh
	:linenos:

	mysql_secure_installation
	
**2. Change user passwords for MySQL and MongoDB:**

.. note::
	Please change the passwords (secret1234, secretsecret) in the following command lines!

.. code-block:: sh
	:linenos:

	mysql -u root -p -e "ALTER USER 'opencelium'@'localhost' IDENTIFIED BY 'secret1234';"
	mongosh --eval "db.getSiblingDB('opencelium').changeUserPassword('oc_admin', 'secretsecret')"

**3. Modify application.yml file for backend:**

.. code-block:: sh
	:linenos:

	cd /opt/opencelium/src/backend/src/main/resources

.. note::
	| Make changes inside the file application.yml! 
	| Change your MongoDB and MySQL database passwords.

**4. Restart Opencelium Backend:**

.. code-block:: sh
	:linenos:
	
	systemctl restart opencelium


RPM package for RedHat 9.2
"""""""""""""""""

.. warning:: 

	| We currently do not support rpm package installations in productive use. 
	| We recommend using it for use in a test phase on a clean system!

Prepare environment:
==================

**1. Update RedHat system:**

.. code-block:: sh
	:linenos:

	yum update
	yum install pygpgme yum-utils
	
.. note::
	You may need to install the EPEL repository for your system to install these packages. 
	If you do not install pygpgme, GPG verification will not work.
	In this case, you can install OpenCelium without GPG verification (see note at installation section).

**2. Install MongoDB:**

| Use default MongoDB installation guide.
| You can find documentation here: `MongoDB Installation <https://www.mongodb.com/docs/manual/administration/install-on-linux/>`_
	

Install Application:
==================

**1. Install deb package for OpenCelium:**

.. code-block:: sh
	:linenos:

	curl -s https://packagecloud.io/install/repositories/becon/opencelium/script.rpm.sh | sudo bash
	sed -i 's!baseurl=.*!baseurl=https://packagecloud.io/becon/opencelium/fedora/40/x86_64!' /etc/yum.repos.d/becon_opencelium.repo
	yum install -y OpenCelium
	
.. note::
	**Install Application without pygpgme:**

	1. Install rpm package for OpenCelium:

	.. code-block:: sh
		:linenos:
	
		cat << EOF >  /etc/yum.repos.d/becon_opencelium.repo
		[becon_opencelium]
		name=becon_opencelium
		baseurl=https://packagecloud.io/becon/opencelium/fedora/40/x86_64
		repo_gpgcheck=0
		gpgcheck=0
		enabled=1
		sslverify=1
		sslcacert=/etc/pki/tls/certs/ca-bundle.crt
		metadata_expire=300
		EOF
		yum install -y OpenCelium
	
.. note::
	| Afterwards you can connect to `http://localhost`	
	| Default User and Password is:
	
	| admin@opencelium.io
	| 1234
	
	| If you want to have a look into OpenCelium Logs please use:
	
	.. code-block:: sh
		:linenos:
		
		journalctl -xe -u opencelium -f
		

Configure environment (optional):
==================

**1. Secure MySql and set root password (only for new MySql installations):**

.. code-block:: sh
	:linenos:

	mysql_secure_installation
	
**2. Change user passwords for MySQL and MongoDB:**

.. note::
	Please change the passwords (secret1234, secretsecret) in the following command lines!

.. code-block:: sh
	:linenos:

	mysql -u root -p -e "ALTER USER 'opencelium'@'localhost' IDENTIFIED BY 'secret1234';"
	mongosh --eval "db.getSiblingDB('opencelium').changeUserPassword('oc_admin', 'secretsecret')"

**3. Modify application.yml file for backend:**

.. code-block:: sh
	:linenos:

	cd /opt/opencelium/src/backend/src/main/resources

.. note::
	| Make changes inside the file application.yml! 
	| Change your MongoDB and MySQL database passwords.

**4. Restart Opencelium Backend:**

.. code-block:: sh
	:linenos:
	
	systemctl restart opencelium
