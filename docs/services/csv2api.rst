##################
csv2api
##################

.. note::
	csv2api is a subscription connector. Make sure that you have already got your subscription. If in doubt, contact our support support@opencelium.io.


Installation
"""""""""""""""""

.. code-block:: sh
        :linenos:
	
	root@shell> mkdir /opt/services
	root@shell> cd /opt/services/
	root@shell> git clone https://github.com/opencelium/csv2api.git
	root@shell> cd csv2api/
	root@shell> gradle build
	root@shell> cd build/libs/
	root@shell> java -jar csvtoapi-0.0.1-SNAPSHOT.jar

Additional Information are available at github (https://github.com/opencelium/csv2api)

Afterwords please download the CSV2api Invoker file from the service portal (https://service.opencelium.io) an import it into you OpenCelium instance.

Serv file through HTTP
"""""""""""""""""

To load the csv file its has to be available through http / https.

**Adhoc**

This can for example be achieved with a simple HTTP Server.
Copy the csv file to a folder you like on a linux server and afterwords execute

.. code-block:: sh
        :linenos:
	
	root@shell> python3 -m http.server 8123

Afterwords you can see  all files at the following address: 
http://[MyLinuxServer]:8123/

The URL for the Connector would be:
http://[Csv2APIServer]:8080?source=http://[MyLinuxServer]:8123/my-test.csv

**Permanent**

.. code-block:: sh
        :linenos:

	root@shell> mkdir /opt/csv2api/

Copy your csv file into this folder.
Change Nginx config an add the following Code:

.. code-block:: JSON

	location /csv2api {
		autoindex on;
		alias /opt/csv2api;
	}

Afterwords you can see  all files at the following address:
http://[MyLinuxServer]/csv2api/

The URL for the Connector would be:
http://[Csv2APIServer]:8080?source=http://[MyLinuxServer]/csv2api//my-test.csv


Usage
"""""""""""""""""

First of all add a connector to your db.

|image0|

After that you can use it in a connection. Add a GetDataSources process to make a request to retrieve data from csv.

|image1|


Additional Service
"""""""""""""""""

User **with subscription** has an access to Service Portal. There is a tool for easy conversion
a csv file into an invoker file.

|image2|

In general data section you need to provide a name, an authentication type and a csv file.

|image3|

There is also a list of already converted files as a history. You can make such manipulations there, like:
download, edit or delete.

|image4|


.. |image0| image:: ../img/services/csv2api/0.png
   :align: middle

.. |image1| image:: ../img/services/csv2api/1.png
   :align: middle

.. |image2| image:: ../img/services/csv2api/2.png
   :align: middle
   :width: 300

.. |image3| image:: ../img/services/csv2api/3.png
   :align: middle

.. |image4| image:: ../img/services/csv2api/4.png
   :align: middle


