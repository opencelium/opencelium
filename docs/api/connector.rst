*********
Connector
*********

In this section you can find, examples of HTTP requests and responses for
managing **Connector**

-----------------------------------------------------------------------------

Create New
==========

.. parsed-literal::
    # Http request
    ``POST`` http://localhost:8080/api/``connector`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

	{
	  "title": "Some title",
	  "description": "Description",
	  "invoker": {
	    "name": "otrs"
	  },
	  "requestData": {
	    "url": "https://demo.de/otrs/nph-genericinterface.pl/Webservice",
	    "WebSirvice": "service name",
	    "username": "username!",
	    "password": "password"
	  }
	}

Get All Connectors
==========

.. parsed-literal::
    # Http request
    ``GET`` http://localhost:8080/api/``connector``/all HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    200 OK
    
.. code-block:: json
    :caption: ``Body:``