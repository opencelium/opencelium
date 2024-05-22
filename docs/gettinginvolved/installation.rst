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
	
	mysql -u root -e "source /opt/opencelium/src/backend/database/oc_data.sql; GRANT ALL PRIVILEGES ON opencelium.* TO 'opencelium'@'localhost' IDENTIFIED BY 'secret1234'; FLUSH PRIVILEGES;"
	systemctl enable mariadb
	mysql_secure_installation
	
**2. MongoDB:**

Start and enable mongod service and create a user for Opencelium.

.. code-block:: sh
	:linenos:
	
	systemctl start mongod
	systemctl enable mongod
	
	mongosh
	use opencelium
	db.createUser(
	{
	user: "oc_admin",
	pwd: passwordPrompt(),
	roles: [ "readWrite", "dbAdmin" ]
	}
	)
	
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
		ln -s /opt/opencelium/conf/nginx-ssl.conf /etc/nginx/conf.d/oc.conf
		
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
	| Within section "Database configuration section of MariaDB":
	| - change password of opencelium user for MariaDB
	
	| Within section "Database configuration section of MongoDB":
	| - change password of oc_admin user for MariaDB

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
		
Configuration
==================

**1. MariaDB:**

Create database and mysql user for OpenCelium, enable mysql service and secure mysql installation.

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh
	:linenos:

	rcmysql start	
	mysql -u root -e "source /opt/opencelium/src/backend/database/oc_data.sql; GRANT ALL PRIVILEGES ON opencelium.* TO 'opencelium'@'localhost' IDENTIFIED BY 'secret1234'; FLUSH PRIVILEGES;"
	systemctl enable mariadb
	mysql_secure_installation
	
**2. MongoDB:**

Start and enable mongod service.

.. code-block:: sh
	:linenos:
	
	systemctl start mongod
	systemctl enable mongod
	
**3. Nginx:**

Copy the configuration file for OpenCelium.

.. code-block:: sh
	:linenos:
	
	cp /opt/opencelium/conf/nginx.conf /etc/nginx/conf.d/oc.conf
	
.. note::
	If you like to use SSL, copy the SSL-configuration file for OpenCelium:
	
	.. code-block:: sh
		:linenos:
	
		cp /opt/opencelium/conf/nginx-ssl.conf /etc/nginx/conf.d/oc.conf
		
	and change the certificates within the config (/etc/nginx/conf.d/oc.conf), with your own:	
			
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
	| Within section "Database configuration section of MariaDB":
	| - change password of opencelium user for MariaDB 

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
		
Configuration
==================

**1. MariaDB:**

Create database and mysql user for OpenCelium, enable mysql service and secure mysql installation.

.. note::
	Please change the password (secret1234) in the following command line!

.. code-block:: sh
	:linenos:
	
	systemctl start mariadb
	mysql -u root -e "source /opt/opencelium/src/backend/database/oc_data.sql; GRANT ALL PRIVILEGES ON opencelium.* TO 'opencelium'@'localhost' IDENTIFIED BY 'secret1234'; FLUSH PRIVILEGES;"
	systemctl enable mariadb
	mysql_secure_installation
	
**2. MongoDB:**

Start and enable mongod service.

.. code-block:: sh
	:linenos:
	
	systemctl restart mongod
	systemctl enable mongod
	
**3. Nginx:**

Copy the configuration file for OpenCelium.

.. code-block:: sh
	:linenos:
	
	cp /opt/opencelium/conf/nginx.conf /etc/nginx/conf.d/oc.conf
	
.. note::
	If you like to use SSL, copy the SSL-configuration file for OpenCelium and create a link to the key-folder:
	
	.. code-block:: sh
		:linenos:
		
		cp /opt/opencelium/conf/nginx-ssl.conf /etc/nginx/conf.d/oc.conf
		ln -s /etc/pki/tls/private/ /etc/ssl/private
		
	Change the certificates within the config (/etc/nginx/conf.d/oc.conf), with your own:
	
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
	| Within section "Database configuration section of MariaDB":
	| - change password of opencelium user for MariaDB 

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
	Only available for Ubuntu systems (tested on 22.04 LTS)!

**Prepare environment:**

1. Install Ansible:

.. code-block:: sh
	:linenos:
	
	add-apt-repository ppa:ansible/ansible
	apt install ansible

2. Get oc playbook:

.. code-block:: sh
	:linenos:

	mkdir /etc/ansible
	git clone https://github.com/opencelium/ansible.git /etc/ansible/

3. Download application files

.. code-block:: sh
	:linenos:

	wget --content-disposition "https://packagecloud.io/becon/opencelium/packages/anyfile/oc_latest.zip/download?distro_version_id=230" -P /etc/ansible/opencelium/files/

4. Run playbook

.. code-block:: sh
	:linenos:

	ansible-playbook --connection=local /etc/ansible/install_oc.yml


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


DEB package for Ubuntu 22.04 LTS
"""""""""""""""""
**Prepare environment:**

1. Update Ubuntu system:

.. code-block:: sh
	:linenos:

	apt update
	apt install curl gnupg

2. Install java:

.. code-block:: sh
	:linenos:

	apt install openjdk-17-jdk

3. Install neo4j:

.. code-block:: sh
	:linenos:

	wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
	echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
	apt update
	apt install neo4j=1:5.7.0
	/usr/bin/neo4j-admin dbms set-initial-password secret1234
	
.. note::
	Change password (secret1234) if you want.

**Install Application:**

1. Install deb package for OpenCelium:

.. code-block:: sh
	:linenos:

	curl -s https://packagecloud.io/install/repositories/becon/opencelium/script.deb.sh | sudo bash
	sed -i 's!deb .*!deb [signed-by=/etc/apt/keyrings/becon_opencelium-archive-keyring.gpg] https://packagecloud.io/becon/opencelium/ubuntu jammy main!' /etc/apt/sources.list.d/becon_opencelium.list
	apt update
	apt install opencelium

**Configure environment:**

1. Secure MySql and set root password (required for new MySql installations):

.. code-block:: sh
	:linenos:

	mysql_secure_installation
	
.. note::
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Please check with this command: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root
		
	If this works (without your password), please set your password again with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.
	
2. Modify application.yml file for backend:

.. code-block:: sh
	:linenos:

	cd /opt/opencelium/src/backend/src/main/resources

.. note::
	Make changes inside the file application.yml! 
	Change neo4j and mysql database password.

3. Restart backend:

.. code-block:: sh
	:linenos:

	oc restart_backend

4. Welcome to OC:

.. code-block:: sh
	:linenos:
	
	Visit opencelium http://SERVERIP



RPM package for SUSE Linux Enterprise Server 15 SP5
"""""""""""""""""
**Prepare environment:**

1. Install java:

.. code-block:: sh
	:linenos:

	zypper install java-17-openjdk

2. Install neo4j:

.. code-block:: sh
	:linenos:

	zypper addrepo --refresh https://yum.neo4j.org/stable/5 neo4j-repository
	zypper refresh
	zypper install neo4j-5.7.0
	/usr/bin/neo4j-admin dbms set-initial-password secret1234 
	zypper install insserv

.. note::
	Change password (secret1234) if you want.

**Install Application:**

1. Install rpm package for OpenCelium:

.. code-block:: sh
	:linenos:

	curl -s https://packagecloud.io/install/repositories/becon/opencelium/script.rpm.sh | sudo bash
	sed -i 's!baseurl=.*!baseurl=https://packagecloud.io/becon/opencelium/sles/15.5/x86_64!' /etc/yum.repos.d/becon_opencelium.repo
	zypper install OpenCelium

**Configure environment:**

1. Secure MySql and set root password (required for new MySql installations):

.. code-block:: sh
	:linenos:

	mysql_secure_installation
	
.. note::
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Please check with this command: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root
		
	If this works (without your password), please set your password again with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.

2. Modify application.yml file for backend:

.. code-block:: sh
	:linenos:

	cd /opt/opencelium/src/backend/src/main/resources
	
.. note::
	Make changes inside the file application.yml! 
	Change neo4j and mysql database password.


3. Restart backend:

.. code-block:: sh
	:linenos:

	oc restart_backend

4. Welcome to OC:

.. code-block:: sh
	:linenos:
	
	Visit opencelium http://SERVERIP


RPM package for RedHat 9.2
"""""""""""""""""
**Prepare environment:**

1. Update RedHat system:

.. code-block:: sh
	:linenos:

	yum update
	yum install pygpgme yum-utils
	
.. note::
	You may need to install the EPEL repository for your system to install these packages. 
	If you do not install pygpgme, GPG verification will not work.
	In this case, you can install OpenCelium without GPG verification (see note at installation section).

2. Install java:

.. code-block:: sh
	:linenos:

	yum install java-17-openjdk

3. Install neo4j:

.. code-block:: sh
	:linenos:

	rpm --import https://debian.neo4j.com/neotechnology.gpg.key
	cat <<EOF>  /etc/yum.repos.d/neo4j.repo
	[neo4j]
	name=Neo4j RPM Repository
	baseurl=https://yum.neo4j.com/stable/5
	enabled=1
	gpgcheck=1
	EOF
	yum install neo4j-5.7.0-1
	/usr/bin/neo4j-admin dbms set-initial-password secret1234
	
.. note::
	Change password (secret1234) if you want.


**Install Application (pygpgme required):**

1. Install rpm package for OpenCelium:

.. code-block:: sh
	:linenos:

	curl -s https://packagecloud.io/install/repositories/becon/opencelium/script.rpm.sh | sudo bash
	sed -i 's!baseurl=.*!baseurl=https://packagecloud.io/becon/opencelium/fedora/40/x86_64!' /etc/yum.repos.d/becon_opencelium.repo
	yum install OpenCelium

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
		yum install OpenCelium

**Configure environment:**

1. Secure MySql and set root password (required for new MySql installations):

.. code-block:: sh
	:linenos:

	mysql_secure_installation
	
.. note::
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Please check with this command: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root
		
	If this works (without your password), please set your password again with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.

2. Modify application.yml file for backend:

.. code-block:: sh
	:linenos:

	cd /opt/opencelium/src/backend/src/main/resources
	
.. note::
	Make changes inside the file application.yml! 
	Change neo4j and mysql database password.

3. Restart backend:

.. code-block:: sh
	:linenos:

	oc restart_backend

4. Welcome to OC:

.. code-block:: sh
	:linenos:
	
	Visit opencelium http://SERVERIP
	

