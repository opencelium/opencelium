##################
Installation
##################

.. note::
	Please check the software requirements, before installing OC. 


Debian/Ubuntu (example for 22.04 LTS)
"""""""""""""""""
**Prepare environment:**

1. Update Debian/Ubuntu system:

.. code-block:: sh
	:linenos:

	apt update
	apt install unzip
	apt-get install libpng-dev libcurl4-gnutls-dev libexpat1-dev gettext libz-dev libssl-dev*

2. Install nodejs:

.. code-block:: sh
	:linenos:
	
	sudo apt install curl (if debian)
	curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
	apt-get install -y nodejs
	
3. Install yarn:

.. code-block:: sh
	:linenos:

	curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
	echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
	apt-get update && apt-get install yarn
	
4. Install git:

.. code-block:: sh
	:linenos:

	apt-get install git
	
5. Install java:

.. code-block:: sh
	:linenos:

	apt install openjdk-17-jdk
	apt install openjdk-17-jre (can be optional)

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	apt-get install software-properties-common (if debian)
	add-apt-repository ppa:cwchien/gradle
	apt-get update
	apt upgrade gradle
	
7. Install neo4j:

.. code-block:: sh
	:linenos:

	wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
	echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
	apt update
	apt install neo4j=1:5.7.0
	/usr/bin/neo4j-admin dbms set-initial-password secret1234
	service neo4j start
	systemctl enable neo4j

.. note::
	Change password (secret1234) if you want.

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	apt install mariadb-server mariadb-client
	mysql_secure_installation
	
.. note::
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Use this command to test your password: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -p
		
	If this dosn't work, please set your password with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.

**Install Application:**

1. Get frontend repository

.. code-block:: sh
	:linenos:

	cd /opt
	git clone -b v3.2 https://github.com/opencelium/opencelium.git . 
	
.. note::
	Get stable versions here https://github.com/opencelium/opencelium/tags

2. Build frontend project

.. code-block:: sh
	:linenos:

	cd src/frontend
	yarn

.. note::
	If yarn doesn't run, use this command to increase the amount of inotify watchers:

	.. code-block:: sh
		:linenos:	

		echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

3. Enable OC service

.. code-block:: sh
	:linenos:

	ln -s /opt/scripts/oc_service.sh /usr/bin/oc

4. Start frontend

.. code-block:: sh
	:linenos:

	oc start_frontend

5. Create application.yml file for backend

.. code-block:: sh
	:linenos:

	cd /opt/src/backend
	cp src/main/resources/application_default.yml src/main/resources/application.yml
	
.. note::
	Make changes inside the file application.yml! 
	Change neo4j and mysql database password.

6. Install database 

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/database
	mysql -u root -p -e "source oc_data.sql"

7. Build backend project

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/
	gradle build

8. Start backend

.. code-block:: sh
	:linenos:

	oc start_backend

9. Welcome to OC

.. code-block:: sh
	:linenos:
	
	Visit opencelium http://SERVERIP:8888





SUSE Linux Enterprise Server (example for SLES 15 SP5)
"""""""""""""""""
**Prepare environment:**

1. Install nodejs:

.. code-block:: sh
	:linenos:
	
	zypper install nodejs20

2. Install yarn:

.. code-block:: sh
	:linenos:

	sudo npm install yarn -g

3. Install git:

.. code-block:: sh
	:linenos:

	zypper install git

4. Install java:

.. code-block:: sh
	:linenos:

	zypper install java-17-openjdk

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	cd /tmp
	wget https://services.gradle.org/distributions/gradle-7.4.2-all.zip
	mkdir /opt/gradle
	unzip -d /opt/gradle gradle-7.4.2-all.zip
	export PATH=$PATH:/opt/gradle/gradle-7.4.2/bin

7. Install neo4j:

.. code-block:: sh
	:linenos:

	zypper addrepo --refresh https://yum.neo4j.org/stable/5 neo4j-repository
	zypper refresh
	zypper install neo4j-5.7.0
	/usr/bin/neo4j-admin dbms set-initial-password secret1234
	neo4j start
	zypper install insserv
	systemctl enable neo4j
	
.. note::
	Change password (secret1234) if you want.

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	zypper install mariadb mariadb-client
	rcmysql start
	mysql_secure_installation
	systemctl enable mariadb

.. note::
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Use this command to test your password: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -p
		
	If this dosn't work, please set your password with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.

**Install Application:**

1. Get frontend repository

.. code-block:: sh
	:linenos:

	cd /opt
	git clone -b <StableVersion> https://bitbucket.org/becon_gmbh/opencelium.git . 
	
.. note::
	Get stable versions here https://bitbucket.org/becon_gmbh/opencelium/downloads/?tab=tags

2. Run frontend with yarn

.. code-block:: sh
	:linenos:

	cd src/frontend
	yarn
	
.. note::
	If yarn doesn't run, use this command to increase the amount of inotify watchers:

	.. code-block:: sh
		:linenos:	

		echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

3. Enable OC service

.. code-block:: sh
	:linenos:

	ln -s /opt/scripts/oc_service.sh /usr/bin/oc

4. Start frontend

.. code-block:: sh
	:linenos:

	oc start_frontend

5. Create application.yml file for backend

.. code-block:: sh
	:linenos:

	cd /opt/src/backend
	cp src/main/resources/application_default.yml src/main/resources/application.yml
	
.. note::
	Make changes inside the file application.yml! 
	Change neo4j and mysql database password.

6. Install database 

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/database
	mysql -u root -p -e "source oc_data.sql"

7. Build backend project

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/
	gradle build

8. Start backend

.. code-block:: sh
	:linenos:

	oc start_backend

9. Welcome to OC

.. code-block:: sh
	:linenos:
	
	Visit opencelium http://SERVERIP:8888



Red Hat Enterprise Linux (example for Red Hat 9.2)
"""""""""""""""""
**Prepare environment:**

1. Update Red Hat system:

.. code-block:: sh
	:linenos:

	yum update

2. Install nodejs:

.. code-block:: sh
	:linenos:
	
	yum install -y gcc-c++ make
	curl -sL https://rpm.nodesource.com/setup_20.x | sudo -E bash -
	yum install nodejs

3. Install yarn:

.. code-block:: sh
	:linenos:

	curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
	yum install yarn

4. Install git:

.. code-block:: sh
	:linenos:

	yum install git

5. Install java:

.. code-block:: sh
	:linenos:

	yum install java-17-openjdk.x86_64

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	cd /tmp
	wget https://services.gradle.org/distributions/gradle-7.4.2-all.zip
	mkdir /opt/gradle
	unzip -d /opt/gradle gradle-7.4.2-all.zip
	export PATH=$PATH:/opt/gradle/gradle-7.4.2/bin

7. Install neo4j:

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
	/usr/bin/neo4j-admin set-initial-password secret1234
	systemctl start neo4j
	systemctl enable neo4j	
	
.. note::
	Change password (secret1234) if you want.

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	yum install mariadb-server
	root@shell>	systemctl start mariadb
	root@shell>	systemctl enable mariadb
	mysql_secure_installation

.. note::
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Use this command to test your password: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -p
		
	If this dosn't work, please set your password with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.

**Install Application:**

1. Get frontend repository

.. code-block:: sh
	:linenos:

	cd /opt
	git clone -b <StableVersion> https://bitbucket.org/becon_gmbh/opencelium.git . 
	
.. note::	
	Get stable versions here https://bitbucket.org/becon_gmbh/opencelium/downloads/?tab=tags

2. Run frontend with yarn

.. code-block:: sh
	:linenos:

	cd src/frontend
	yarn
	
.. note::
	If yarn doesn't run, use this command to increase the amount of inotify watchers:

	.. code-block:: sh
		:linenos:	

		echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

3. Enable OC service

.. code-block:: sh
	:linenos:

	ln -s /opt/scripts/oc_service.sh /usr/bin/oc
	oc start_frontend


4. Create application.yml file for backend

.. code-block:: sh
	:linenos:

	cd /opt/src/backend
	cp src/main/resources/application_default.yml src/main/resources/application.yml

.. note::
	Make changes inside the file application.yml! 
	Change neo4j and mysql database password.

5. Install database 

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/database
	mysql -u root -p -e "source oc_data.sql"

6. Build backend project

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/
	gradle build

7. Start backend

.. code-block:: sh
	:linenos:

	oc start_backend

8. Welcome to OC

.. code-block:: sh
	:linenos:
	
	Visit opencelium http://SERVERIP:8888

.. note::
        Please make sure that firewall is disabled (service firewalld stop)!


Ansible
"""""""""""""""""

.. note::
	Only available for Ubuntu system (>=16.04 LTS)!

**Prepare environment:**

1. Install Ansible:

.. note::
	Use default Ansible installation guide. You can find documentation here -> https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html

2. Get oc playbook:

.. code-block:: sh
	:linenos:

	cd /etc/ansible
	git clone https://bitbucket.org/becon_gmbh/opencelium.setup.ansible.git .

3. Add localhost in ansible

.. code-block:: sh
	:linenos:

	printf "[local]\nlocalhost ansible_connection=local" >> hosts

4. Run playbook

.. code-block:: sh
	:linenos:

	ansible-playbook --connection=local -e 'host_key_checking=False' playbooks/install_oc.yml


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

	apt install java-17-openjdk

3. Install neo4j:

.. code-block:: sh
	:linenos:

	wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
	echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
	apt update
	apt install install neo4j=1:5.7.0
	/usr/bin/neo4j-admin dbms set-initial-password secret1234
	
.. note::
	Change password (secret1234) if you want.

**Install Application:**

1. Install deb package for OpenCelium:

.. code-block:: sh
	:linenos:

	curl -s https://packagecloud.io/install/repositories/becon/opencelium/script.deb.sh | sudo bash
	sed -i 's!deb .*!deb [signed-by=/etc/apt/keyrings/becon_opencelium-archive-keyring.gpg] https://packagecloud.io/becon/opencelium/ubuntu jammy main' /etc/apt/sources.list.d/becon_opencelium.list
	apt install opencelium

**Configure environment:**

1. Secure MySql and set root password (required for new MySql installations):

.. code-block:: sh
	:linenos:

	mysql_secure_installation
	
.. note::
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Use this command to test your password: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -p
		
	If this dosn't work, please set your password with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.
	
2. Modify application.yml file for backend:

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/main/resources

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

1. Update SUSE system:

.. code-block:: sh
	:linenos:

	zypper update

2. Install java:

.. code-block:: sh
	:linenos:

	zypper install java-17-openjdk

3. Install neo4j:

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
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Use this command to test your password: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -p
		
	If this dosn't work, please set your password with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.

2. Modify application.yml file for backend:

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/main/resources
	
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
	yum addrepo --refresh https://yum.neo4j.org/stable/5 neo4j-repository
	yum refresh
	yum install neo4j-5.7.0-1
	/usr/bin/neo4j-admin set-initial-password secret1234
	
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
	Sometimes setting password doesn't work prperly by mysql_secure_installation. Use this command to test your password: 
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -p
		
	If this dosn't work, please set your password with this command:
	
	.. code-block:: sh
		:linenos:	
	
		mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
		
	Change password (root) if you want.

2. Modify application.yml file for backend:

.. code-block:: sh
	:linenos:

	cd /opt/src/backend/main/resources
	
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
	

