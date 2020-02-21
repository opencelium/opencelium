##################
Installation
##################

.. note::
	Please check the software requirements, before installing OC. 


Windows
"""""""""""""""""

**Instructions:**

1. Install Node.js
2. Install yarn
3. Download the project from the bitbucket or clone it with the git tool on your pc.
4. Open the front-end folder with IDE tool or in terminal/command line.
5. Run the next command to install node-modules:

.. code-block:: sh

	root@shell> yarn

6. Run the next command to run the project: 

.. code-block:: shell

	root@shell> yarn start

After that, your browser should automatically open a new tab with url: `http://localhost:3000/ <http://localhost:3000/>`_

7. Install JDK and JRE.
8. Unpack the Gradle into c:\\Gradle
9. Install MariaDB
10. Unpack Neo4j Community version into c:\\Neo4j
11. Run the next command 

		*setx path “%path%;[path_to_jdk];[path_to_jre];[path_to_gradle];[path_to_neo4j];[path_to_mariadb] \M”*



Debian/Ubuntu
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
	root@shell> curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
	root@shell> apt-get install -y nodejs
	root@shell> nodejs -v // to check

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

	root@shell> apt install openjdk-8-jdk
	root@shell> apt install openjdk-8-jre (can be optional)
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

	root@shell> wget --no-check-certificate -O - https://debian.neo4j.org/neotechnology.gpg.key | sudo apt-key add -
	root@shell> echo 'deb http://debian.neo4j.org/repo stable/' > /etc/apt/sources.list.d/neo4j.list
	root@shell> apt update
	root@shell> apt install neo4j
	root@shell> /usr/bin/neo4j-admin set-initial-password secret // change password if you want
	root@shell> service neo4j status  // to check
	root@shell> sed -i '/#dbms.connectors.default_listen_address=0.0.0.0/c\dbms.connectors.default_listen_address=0.0.0.0' /etc/neo4j/neo4j.conf
	root@shell> sed -i '/#dbms.security.auth_enabled=false/c\dbms.security.auth_enabled=false' /etc/neo4j/neo4j.conf	
        root@shell> service neo4j restart

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	root@shell> apt install mariadb-server mariadb-client
	root@shell> mysql_secure_installation // set password
	root@shell> mysql -u root -e "UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE User = 'root';"
	root@shell> mysql -u root -e "FLUSH PRIVILEGES"
	root@shell> mysql --version // to check

9. Install MY-NETDATA:

.. code-block:: sh
	:linenos:

	if debian
	root@shell> sudo apt-get install zlib1g-dev uuid-dev libmnl-dev pkg-config gcc make autoconf autoconf-archive autogen automake python python-yaml python-mysqldb nodejs lm-sensors python-psycopg2 netcat
	root@shell> git clone https://github.com/firehol/netdata.git --depth=1 /usr/lib/netdata
	root@shell> cd /usr/lib/netdata
	root@shell> sudo ./netdata-installer.sh

	if ubuntu
	root@shell> apt-get install netdata -y
	root@shell> sed -i '/\tbind socket to IP = 127.0.0.1/c\\tbind socket to IP = 0.0.0.0' /etc/netdata/netdata.conf
	root@shell> wget https://bitbucket.org/becon_gmbh/opencelium/raw/cf5b43c102cca25d0a7abe778f1de0fe0c4e40c7/docs/netdata/oc-mode.html -O /usr/share/netdata/web/oc-mode.html
	root@shell> chown netdata:netdata /usr/share/netdata/web/oc-mode.html (if debian)
	root@shell> systemctl restart netdata

10. Install Elasticsearch (optional)

.. code-block:: sh
	:linenos:

	 root@shell> apt-get install apt-transport-https
	 root@shell> wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
	 root@shell> add-apt-repository "deb https://artifacts.elastic.co/packages/7.x/apt stable main"
	 root@shell> apt-get update
	 root@shell> apt-get install elasticsearch
	 root@shell> sed -i '/\#cluster.name: my-application/c\cluster.name: opencelium' /etc/elasticsearch/elasticsearch.yml
	 root@shell> sed -i '/\#network.host: 192.168.0.1/c\network.host: 0.0.0.0' /etc/elasticsearch/elasticsearch.yml
	 root@shell> /bin/systemctl enable elasticsearch.service
	 root@shell> systemctl start elasticsearch.service

.. note::
        If elasticsearch not add this at the end oft the config file: transport.host: localhost

11. Install Kibana (optional)

.. code-block:: sh
	:linenos:

	 root@shell> apt-get install kibana
	 root@shell> sed -i '/\#server.host: "localhost"/c\\server.host: "0.0.0.0"' /etc/kibana/kibana.yml
	 root@shell> sed -i '/\#elasticsearch.hosts: ["http://localhost:9200"]/c\\elasticsearch.hosts: ["http://localhost:9200"]' /etc/kibana/kibana.yml
	 root@shell> service kibana start


**Install Application:**

1. Get frontend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone https://$user@bitbucket.org/becon_gmbh/opencelium.frontend.git // please replace $user with your username

2. Run frontend with yarn

.. code-block:: sh

	root@shell> cd opencelium.frontend
	root@shell> yarn
	root@shell> echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p // increasing the amount of inotify watchers
	root@shell> yarn start_dev // use "nohup" to run process in the background


4. Get backend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone https://$user@bitbucket.org/becon_gmbh/opencelium.backend.git // please replace $user with your username

5. Create application.yml file

.. code-block:: sh

	root@shell> cp opencelium.backend/src/main/resources/application_default.yml opencelium.backend/src/main/resources/application.yml
	root@shell> make changes inside of application.yml. change neo4j and mysql database password

6. Install database 

.. code-block:: sh

	root@shell> cd /opt/opencelium.backend/database
	root@shell> mysql -u root -p -e "source oc_data.sql"

7. Build backend project

.. code-block:: sh

	root@shell> cd /opt/opencelium.backend/
	root@shell> gradle build

8. Start backend

.. code-block:: sh

	root@shell> java -Dserver.port=9090 -jar /opt/opencelium.backend/build/libs/opencelium.backend-0.0.1-SNAPSHOT.jar // use "nohup" to run process in the background

9. Welcome to OC

.. code-block:: sh
	
	Visit opencelium http://SERVERIP:8888

.. note::
        If yarn not run use this command: echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p



SUSE Linux Enterprise Server
"""""""""""""""""
**Prepare environment:**

1. Install nodejs:

.. code-block:: sh
	:linenos:
	
	root@shell> zypper addrepo http://download.opensuse.org/repositories/devel:/languages:/nodejs/openSUSE_Leap_15.0 node10
	root@shell> zypper refresh
	root@shell> zypper install nodejs10
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

	root@shell> zypper install java-1_8_0-openjdk
	root@shell> zypper install java-1_8_0-openjdk-devel
	root@shell> java -version // to check

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	root@shell> cd /tmp
	root@shell> wget https://services.gradle.org/distributions/gradle-5.6.2-all.zip
	root@shell> mkdir /opt/gradle
	root@shell> unzip -d /opt/gradle gradle-5.6.2-all.zip
	root@shell> export PATH=$PATH:/opt/gradle/gradle-5.6.2/bin
	root@shell> gradle -v // to check

7. Install neo4j:

.. code-block:: sh
	:linenos:

	root@shell> zypper addrepo --refresh https://yum.neo4j.org/stable neo4j-repository
	root@shell> zypper refresh
	root@shell> zypper install neo4j-3.5.11
	root@shell> /usr/bin/neo4j-admin set-initial-password secret // change password if you want
	root@shell> neo4j start
	root@shell> neo4j status  // to check
	root@shell> sed -i '/#dbms.connectors.default_listen_address=0.0.0.0/c\dbms.connectors.default_listen_address=0.0.0.0' /etc/neo4j/neo4j.conf
	root@shell> sed -i '/#dbms.security.auth_enabled=false/c\dbms.security.auth_enabled=false' /etc/neo4j/neo4j.conf	
    root@shell> neo4j restart

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	root@shell> zypper install mariadb mariadb-client
	root@shell> rcmysql start
	root@shell> mysql_secure_installation // set password	
	root@shell> mysql --version // to check

9. Install MY-NETDATA:

.. code-block:: sh
	:linenos:

	if debian
	root@shell> zypper install zlib-devel libuuid-devel libmnl-dev pkg-config gcc make autoconf autoconf-archive autogen automake python python-yaml python-mysqldb nodejs lm-sensors python-psycopg2 netcat 
	root@shell> git clone https://github.com/firehol/netdata.git --depth=1 /usr/lib/netdata
	root@shell> cd /usr/lib/netdata
	root@shell> sudo ./netdata-installer.sh
	root@shell> sed -i '/\tbind socket to IP = 127.0.0.1/c\\tbind socket to IP = 0.0.0.0' /etc/netdata/netdata.conf
	root@shell> wget https://bitbucket.org/becon_gmbh/opencelium.frontend.docs/raw/4169a8422cf65de88b4ffb1ed0f21766affca862/docs/files/oc-mode.html -O /usr/share/netdata/web/oc-mode.html
	root@shell> chown netdata:netdata /usr/share/netdata/web/oc-mode.html
	root@shell> service netdata status

**Install Application:**

1. Get frontend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone https://$user@bitbucket.org/becon_gmbh/opencelium.frontend.git // please replace $user with your username

2. Run frontend with yarn

.. code-block:: sh

	root@shell> cd opencelium.frontend
	root@shell> yarn
	root@shell> yarn start_dev // use "nohup" to run process in the background


4. Get backend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone https://$user@bitbucket.org/becon_gmbh/opencelium.backend.git // please replace $user with your username

5. Create application.yml file

.. code-block:: sh

	root@shell> cp opencelium.backend/src/main/resources/application_default.yml opencelium.backend/src/main/resources/application.yml
	root@shell> make changes inside of application.yml. change neo4j and mysql database password

6. Install database 

.. code-block:: sh

	root@shell> cd /opt/opencelium.backend/database
	root@shell> mysql -u root -p -e "source oc_data.sql"

7. Build backend project

.. code-block:: sh

	root@shell> cd /opt/opencelium.backend/
	root@shell> gradle build

8. Start backend

.. code-block:: sh

	root@shell> java -Dserver.port=9090 -jar /opt/opencelium.backend/build/libs/opencelium.backend-0.0.1-SNAPSHOT.jar // use "nohup" to run process in the background

9. Welcome to OC

.. code-block:: sh
	
	Visit opencelium http://SERVERIP:8888



Red Hat Enterprise Linux
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
	root@shell> curl -sL https://rpm.nodesource.com/setup_12.x | sudo -E bash -
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

	root@shell> yum install java-1.8.0-openjdk
	root@shell> yum install java-1.8.0-openjdk-devel
	root@shell> java -version // to check

6. Install gradle:

.. code-block:: sh
	:linenos:
	
	root@shell> cd /tmp
	root@shell> wget https://services.gradle.org/distributions/gradle-5.6.2-all.zip
	root@shell> mkdir /opt/gradle
	root@shell> unzip -d /opt/gradle gradle-5.6.2-all.zip
	root@shell> export PATH=$PATH:/opt/gradle/gradle-5.6.2/bin
	root@shell> gradle -v // to check

7. Install neo4j:

.. code-block:: sh
	:linenos:

	root@shell> rpm --import https://debian.neo4j.org/neotechnology.gpg.key
	root@shell> cat <<EOF>  /etc/yum.repos.d/neo4j.repo
				[neo4j]
				name=Neo4j RPM Repository
				baseurl=https://yum.neo4j.org/stable
				enabled=1
				gpgcheck=1
				EOF
	root@shell> yum install neo4j-3.5.11
	root@shell> /usr/bin/neo4j-admin set-initial-password secret // change password if you want
	root@shell> service neo4j status  // to check
	root@shell> sed -i '/#dbms.connectors.default_listen_address=0.0.0.0/c\dbms.connectors.default_listen_address=0.0.0.0' /etc/neo4j/neo4j.conf
	root@shell> sed -i '/#dbms.security.auth_enabled=false/c\dbms.security.auth_enabled=false' /etc/neo4j/neo4j.conf	
        root@shell> service neo4j restart

8. Install MariaDB:

.. code-block:: sh
	:linenos:

	root@shell> yum install mariadb-server
	root@shell>	service mariadb start
	root@shell> mysql_secure_installation // set password
	root@shell> mysql --version // to check

9. Install MY-NETDATA:

.. code-block:: sh
	:linenos:

	if debian
	root@shell> yum install zlib-devel libuuid-devel libmnl-devel gcc make git autoconf autogen automake pkgconfig
	root@shell> git clone https://github.com/firehol/netdata.git --depth=1 /usr/lib/netdata
	root@shell> cd /usr/lib/netdata
	root@shell> sudo ./netdata-installer.sh
	root@shell> sed -i '/\tbind socket to IP = 127.0.0.1/c\\tbind socket to IP = 0.0.0.0' /etc/netdata/netdata.conf
	root@shell> wget https://bitbucket.org/becon_gmbh/opencelium.frontend.docs/raw/4169a8422cf65de88b4ffb1ed0f21766affca862/docs/files/oc-mode.html -O /usr/share/netdata/web/oc-mode.html
	root@shell> chown netdata:netdata /usr/share/netdata/web/oc-mode.html
	root@shell> systemctl restart netdata

**Install Application:**

1. Get frontend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone https://$user@bitbucket.org/becon_gmbh/opencelium.frontend.git // please replace $user with your username

2. Run frontend with yarn

.. code-block:: sh

	root@shell> cd opencelium.frontend
	root@shell> yarn
	root@shell> echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p // increasing the amount of inotify watchers
	root@shell> yarn start_dev // use "nohup" to run process in the background


4. Get backend repository

.. code-block:: sh

	root@shell> cd /opt
	root@shell> git clone https://$user@bitbucket.org/becon_gmbh/opencelium.backend.git // please replace $user with your username

5. Create application.yml file

.. code-block:: sh

	root@shell> cp opencelium.backend/src/main/resources/application_default.yml opencelium.backend/src/main/resources/application.yml
	root@shell> make changes inside of application.yml. change neo4j and mysql database password

6. Install database 

.. code-block:: sh

	root@shell> cd /opt/opencelium.backend/database
	root@shell> mysql -u root -p -e "source oc_data.sql"

7. Build backend project

.. code-block:: sh

	root@shell> cd /opt/opencelium.backend/
	root@shell> gradle build

8. Start backend

.. code-block:: sh

	root@shell> java -Dserver.port=9090 -jar /opt/opencelium.backend/build/libs/opencelium.backend-0.0.1-SNAPSHOT.jar // use "nohup" to run process in the background

9. Welcome to OC

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
	root@shell> git clone https://bitbucket.org/becon_gmbh/opencelium.setup.ansible.git
	root@shell> mv opencelium.setup.ansible/* ./
	root@shell> mv opencelium.setup.ansible/.* ./
	root@shell> rmdir opencelium.setup.ansible

3. Add localhost in ansible

.. code-block:: sh

	root@shell> printf "[local]\nlocalhost ansible_connection=local" >> hosts

4. Run playbook

.. code-block:: sh

	root@shell> ansible-playbook --connection=local -e 'host_key_checking=False' playbooks/install_oc.yml
