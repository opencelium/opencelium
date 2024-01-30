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

	root@shell> apt update
	root@shell> apt install unzip
	root@shell> apt-get install libpng-dev libcurl4-gnutls-dev libexpat1-dev gettext libz-dev libssl-dev*

2. Install nodejs:

.. code-block:: sh
	:linenos:
	
	root@shell> sudo apt install curl (if debian)
	root@shell> curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
	root@shell> apt-get install -y nodejs
	root@shell> node -v // to check

3. Install yarn:

.. code-block:: sh
	:linenos:

	root@shell> curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
	root@shell> echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
	root@shell> apt-get update && apt-get install yarn
	root@shell> yarn -v // to check

4. Install git:

.. code-block:: sh
	:linenos:

	root@shell> apt-get install git
	root@shell> git --version // to check

5. Install java:

.. code-block:: sh
	:linenos:

	root@shell> apt install openjdk-17-jdk
	root@shell> apt install openjdk-17-jre (can be optional)
	root@shell> java -version // to check

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	root@shell> apt-get install software-properties-common (if debian)
	root@shell> add-apt-repository ppa:cwchien/gradle
	root@shell> apt-get update
	root@shell> apt upgrade gradle
	root@shell> gradle -v // to check

7. Install neo4j:

.. code-block:: sh
	:linenos:

	root@shell> wget -O - https://debian.neo4j.com/neotechnology.gpg.key | sudo apt-key add -
	root@shell> echo 'deb https://debian.neo4j.com stable latest' | sudo tee -a /etc/apt/sources.list.d/neo4j.list
	root@shell> apt update
	root@shell> apt install install neo4j=1:5.7.0
	root@shell> /usr/bin/neo4j-admin dbms set-initial-password secret1234 // change password if you want
	root@shell> service neo4j status  // to check
        root@shell> service neo4j restart
        root@shell> systemctl enable neo4j

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	root@shell> apt install mariadb-server mariadb-client
	root@shell> mysql_secure_installation // set password
	root@shell> mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"  // change password if you want
	root@shell> mysql --version // to check


**Install Application:**

1. Get frontend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone -b v3.2 https://github.com/opencelium/opencelium.git . // Get stable versions here https://github.com/opencelium/opencelium/tags

2. Build frontend project

.. code-block:: sh

	root@shell> cd src/frontend
	root@shell> yarn
	root@shell> echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p // increasing the amount of inotify watchers	

3. Enable OC service

.. code-block:: sh

        root@shell> ln -s /opt/scripts/oc_service.sh /usr/bin/oc

4. Start frontend

.. code-block:: sh

        root@shell> oc start_frontend

5. Create application.yml file for backend

.. code-block:: sh

	root@shell> cd /opt/src/backend
	root@shell> cp src/main/resources/application_default.yml src/main/resources/application.yml
	root@shell> // make changes inside of application.yml. change neo4j and mysql database password

6. Install database 

.. code-block:: sh

	root@shell> cd /opt/src/backend/database
	root@shell> mysql -u root -p -e "source oc_data.sql"

7. Build backend project

.. code-block:: sh

	root@shell> cd /opt/src/backend/
	root@shell> gradle build

8. Start backend

.. code-block:: sh

        root@shell> oc start_backend

9. Welcome to OC

.. code-block:: sh
	
	Visit opencelium http://SERVERIP:8888

.. note::
        If yarn is not run use this command: echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p



SUSE Linux Enterprise Server (example for SLES 15 SP5)
"""""""""""""""""
**Prepare environment:**

1. Install nodejs:

.. code-block:: sh
	:linenos:
	
	root@shell> zypper install nodejs20
	root@shell> node -v

2. Install yarn:

.. code-block:: sh
	:linenos:

	root@shell> sudo npm install yarn -g
	root@shell> yarn -v // to check

3. Install git:

.. code-block:: sh
	:linenos:

	root@shell> zypper install git
	root@shell> git --version // to check

4. Install java:

.. code-block:: sh
	:linenos:

	root@shell> zypper install java-17-openjdk
	root@shell> java -version // to check

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	root@shell> cd /tmp
	root@shell> wget https://services.gradle.org/distributions/gradle-7.4.2-all.zip
	root@shell> mkdir /opt/gradle
	root@shell> unzip -d /opt/gradle gradle-7.4.2-all.zip
	root@shell> export PATH=$PATH:/opt/gradle/gradle-7.4.2/bin
	root@shell> gradle -v // to check

7. Install neo4j:

.. code-block:: sh
	:linenos:

	root@shell> zypper addrepo --refresh https://yum.neo4j.org/stable/5 neo4j-repository
	root@shell> zypper refresh
	root@shell> zypper install neo4j-5.7.0
	root@shell> /usr/bin/neo4j-admin dbms set-initial-password secret1234 // change password if you want
	root@shell> neo4j start
	root@shell> neo4j status  // to check
	root@shell> zypper install insserv
	root@shell> systemctl enable neo4j

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	root@shell> zypper install mariadb mariadb-client
	root@shell> rcmysql start
	root@shell> mysql_secure_installation // set password	
	root@shell> mysql --version // to check
	root@shell> systemctl enable mariadb


**Install Application:**

1. Get frontend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone -b <StableVersion> https://bitbucket.org/becon_gmbh/opencelium.git . // Get stable versions here https://bitbucket.org/becon_gmbh/opencelium/downloads/?tab=tags

2. Run frontend with yarn

.. code-block:: sh

        root@shell> cd src/frontend
        root@shell> yarn
        root@shell> echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p // increasing the amount of inotify watchers

3. Enable OC service

.. code-block:: sh

        root@shell> ln -s /opt/scripts/oc_service.sh /usr/bin/oc

4. Start frontend

.. code-block:: sh

        root@shell> oc start_frontend

5. Create application.yml file for backend

.. code-block:: sh

	root@shell> cd /opt/src/backend
	root@shell> cp src/main/resources/application_default.yml src/main/resources/application.yml
	root@shell> // make changes inside of application.yml. change neo4j and mysql database password

6. Install database 

.. code-block:: sh

	root@shell> cd /opt/src/backend/database
	root@shell> mysql -u root -p -e "source oc_data.sql"

7. Build backend project

.. code-block:: sh

	root@shell> cd /opt/src/backend/
	root@shell> gradle build

8. Start backend

.. code-block:: sh

        root@shell> oc start_backend

9. Welcome to OC

.. code-block:: sh
	
	Visit opencelium http://SERVERIP:8888



Red Hat Enterprise Linux (example for Red Hat 9.2)
"""""""""""""""""
**Prepare environment:**

1. Update Red Hat system:

.. code-block:: sh
	:linenos:

	root@shell> yum update

2. Install nodejs:

.. code-block:: sh
	:linenos:
	
	root@shell> yum install -y gcc-c++ make
	root@shell> curl -sL https://rpm.nodesource.com/setup_20.x | sudo -E bash -
	root@shell> yum install nodejs
	root@shell> node -v // to check

3. Install yarn:

.. code-block:: sh
	:linenos:

	root@shell> curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
	root@shell> yum install yarn
	root@shell> yarn -v // to check

4. Install git:

.. code-block:: sh
	:linenos:

	root@shell> yum install git
	root@shell> git --version // to check

5. Install java:

.. code-block:: sh
	:linenos:

	root@shell> yum install java-17-openjdk.x86_64
	root@shell> java -version // to check

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	root@shell> cd /tmp
	root@shell> wget https://services.gradle.org/distributions/gradle-7.4.2-all.zip
	root@shell> mkdir /opt/gradle
	root@shell> unzip -d /opt/gradle gradle-7.4.2-all.zip
	root@shell> export PATH=$PATH:/opt/gradle/gradle-7.4.2/bin
	root@shell> gradle -v // to check

7. Install neo4j:

.. code-block:: sh
	:linenos:

	root@shell> rpm --import https://debian.neo4j.com/neotechnology.gpg.key
	root@shell> cat <<EOF>  /etc/yum.repos.d/neo4j.repo
				[neo4j]
				name=Neo4j RPM Repository
				baseurl=https://yum.neo4j.com/stable/5
				enabled=1
				gpgcheck=1
				EOF
	root@shell> yum install neo4j-5.7.0-1
	root@shell> /usr/bin/neo4j-admin set-initial-password secret1234 // change password if you want
	root@shell> systemctl start neo4j
	root@shell> systemctl enable neo4j	
	root@shell> systemctl status neo4j // to check

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	root@shell> yum install mariadb-server
	root@shell>	systemctl start mariadb
	root@shell>	systemctl enable mariadb
	root@shell> mysql_secure_installation // set password
	root@shell> mysql --version // to check


**Install Application:**

1. Get frontend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone -b <StableVersion> https://bitbucket.org/becon_gmbh/opencelium.git . // Get stable versions here https://bitbucket.org/becon_gmbh/opencelium/downloads/?tab=tags

2. Run frontend with yarn

.. code-block:: sh

	root@shell> cd src/frontend
	root@shell> yarn
	root@shell> echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p // increasing the amount of inotify watchers

3. Enable OC service

.. code-block:: sh

        root@shell> ln -s /opt/scripts/oc_service.sh /usr/bin/oc
        root@shell> oc start_frontend


4. Create application.yml file for backend

.. code-block:: sh

	root@shell> cd /opt/src/backend
	root@shell> cp src/main/resources/application_default.yml src/main/resources/application.yml
	root@shell> // make changes inside of application.yml. change neo4j and mysql database password

5. Install database 

.. code-block:: sh

	root@shell> cd /opt/src/backend/database
	root@shell> mysql -u root -p -e "source oc_data.sql"

6. Build backend project

.. code-block:: sh

	root@shell> cd /opt/src/backend/
	root@shell> gradle build

7. Start backend

.. code-block:: sh

        root@shell> oc start_backend

8. Welcome to OC

.. code-block:: sh
	
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

	root@shell> cd /etc/ansible
	root@shell> git clone https://bitbucket.org/becon_gmbh/opencelium.setup.ansible.git .

3. Add localhost in ansible

.. code-block:: sh

	root@shell> printf "[local]\nlocalhost ansible_connection=local" >> hosts

4. Run playbook

.. code-block:: sh

	root@shell> ansible-playbook --connection=local -e 'host_key_checking=False' playbooks/install_oc.yml


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

	root@shell> git clone https://github.com/opencelium/opencelium-docker.git  // we recommend to use always the latest tag version 
	root@shell> cd opencelium-docker

3. Start OpenCelium using DockerHub images

.. code-block:: sh

	root@shell> docker-compose up -d
