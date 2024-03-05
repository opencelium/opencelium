##################
csv2api
##################

.. note::
	csv2api is a subscription connector. Make sure that you have already got your subscription. If in doubt, contact our support support@opencelium.io.


# Installation
```
mkdir /opt/services
cd /opt/services/
git clone https://github.com/opencelium/csv2api.git
cd csv2api/
gradle build
cd build/libs/
java -jar csvtoapi-0.0.1-SNAPSHOT.jar
```

additional Information are available at github (https://github.com/opencelium/csv2api)

Afterwords please download the CSV2api Invoker file from the service portal (https://service.opencelium.io) an import it into you OpenCelium instance.
# Serv file through HTTP

 To load the csv file its has to be available through http / https.
## Adhoc

This can for example be achieved with a simple HTTP Server.
Copy the csv file to a folder you like on a linux server and afterwords execute
``python3 -m http.server 8123``

Afterwords you can see  all files at the following address:
http://[MyLinuxServer]:8123/

The URL for the Connector would be:
http://[Csv2APIServer]:8080?source=http://[MyLinuxServer]:8123/my-test.csv

## Permanent

```
mkdir /opt/csv2api/
```

Copy your csv file into this folder.
Change Nginx config an add the following Code:

```
location /csv2api {
		autoindex on;
		alias /opt/csv2api;
    }
```

Afterwords you can see  all files at the following address:
http://[MyLinuxServer]/csv2api/

The URL for the Connector would be:
http://[Csv2APIServer]:8080?source=http://[MyLinuxServer]/csv2api//my-test.csv

# Usage
 
First of all add a Conenctor to your csv file. Be sure your csv file does not have empty columns at the end.
![Image0](../img/services/csv2api/0.png)

Within the connector username and password could not be empty but this don't need to be valid user. Just enter something random to be able to save the connector.
Next step would be to create a connection and within this connection you are able to use the GetDataSource function to read yourt csv as a json.

![Image1](../img/services/csv2api/1.png)

# Addtional Service

With the standard invoker file above you just have a basic connection to your csv file. User with a subscription will have access to the "CSV Connector Generator". 

![Image2](../img/services/csv2api/2.png)

With this generator you have a easy possibility, to create a specific invoker matching your csv file.
With this you will have all the column headers from your csv file available as fields within the connection.

Just provide a name and choose your csv file.
![Image3](../img/services/csv2api/3.png)


There is also a list of already converted files.
![Image4](../img/services/csv2api/4.png)
