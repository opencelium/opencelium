##################
Installation
##################

.. note::
	Before starting the OC you need to download software that are in the requirements. How to install the corresponded program you can find on the official websites, that are provided in the parenthesis.


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



Ubuntu
"""""""""""""""""
**Preparation before installation:**

.. code-block:: sh
	:linenos:

	root@shell> sudo apt update
	root@shell> sudo apt unzip
	root@shell> apt-get install libpng-dev

**Instructions:**

1. Run to install yarn:

.. code-block:: sh
	:linenos:

	root@shell> curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
	root@shell> echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
	root@shell> sudo apt-get update && sudo apt-get install yarn
	root@shell> yarn -v // to check

2. Run to install nodejs:

.. code-block:: sh
	:linenos:

	root@shell> sudo apt install nodejs
	root@shell> yarn -v // to check

3. Run to install git:

.. code-block:: sh
	:linenos:

	root@shell> sudo apt-get install libcurl4-gnutls-dev libexpat1-dev gettext \ libz-dev libssl-dev*
	root@shell> apt-get install git
	root@shell> git --version // to check

4. Run to install java:

.. code-block:: sh
	:linenos:

	root@shell> sudo apt install openjdk-8-jdk
	root@shell> sudo apt install openjdk-8-jre (can be optional)
	root@shell> java -version // to check

5. Run to install gradle:

.. code-block:: sh
	:linenos:

	root@shell> wget https://services.gradle.org/distributions/gradle-5.0-bin.zip -P /tmp
	root@shell> unzip -d /opt/gradle /tmp/gradle-*.zip
	root@shell> printf "export GRADLE_HOME=/opt/gradle/gradle-5.0\nexport PATH=${GRADLE_HOME}/bin:${PATH}" > /etc/profile.d/gradle.sh
	root@shell> chmod +x /etc/profile.d/gradle.sh
	root@shell> source /etc/profile.d/gradle.sh
	root@shell> gradle -v // to check

6. Run to install neo4j:

.. code-block:: sh
	:linenos:

	root@shell> sudo su (recommended)
	root@shell> wget --no-check-certificate -O - https://debian.neo4j.org/neotechnology.gpg.key | sudo apt-key add -
	root@shell> echo 'deb http://debian.neo4j.org/repo stable/' > /etc/apt/sources.list.d/neo4j.list
	root@shell> apt update
	root@shell> apt install neo4j
	root@shell> /usr/bin/neo4j-admin set-initial-password secret
	root@shell> service neo4j status  // to check
	root@shell> sed -i '/#dbms.connectors.default_listen_address=0.0.0.0/c\dbms.connectors.default_listen_address=0.0.0.0' /etc/neo4j/neo4j.conf
	root@shell> sed -i '/#dbms.security.auth_enabled=false/c\dbms.security.auth_enabled=false' /etc/neo4j/neo4j.conf	

7. Run to install MariaDB:

.. code-block:: sh
	:linenos:

	root@shell> apt install mariadb-server mariadb-client
	root@shell> mysql_secure_installation // set password
	root@shell> mysql -u root -e "UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE User = 'root';"
	root@shell> mysql -u root -e "FLUSH PRIVILEGES"
	root@shell> mysql --version // to check

8. Create application.yml file

.. code-block:: sh

	root@shell> cp src/main/resources/application_default.yml src/main/resources/application.yml


