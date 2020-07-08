*********
Component
*********


Here you can manage only components.

-----------------------------------------------------------------------------

Get Component list
===================

.. parsed-literal::
    # Http request to get all components
    ``PUT`` http://localhost:8080/api/component/``all`` HTTP/1.1

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

    {
        "_embedded": {
            "componentResources": [
                {
                    "enhanceId": 1,
                    "name": "CONNECTION",
                    "description": "Connection description",
                    "permissions": null
                },
                {
                    "enhanceId": 2,
                    "name": "CONNECTOR",
                    "description": "Connector description",
                    "permissions": null
                },
                {
                    "enhanceId": 3,
                    "name": "EVENT",
                    "description": "Event description",
                    "permissions": null
                },
                {
                    "enhanceId": 4,
                    "name": "USER",
                    "description": "User description",
                    "permissions": null
                },
                {
                    "enhanceId": 5,
                    "name": "USERGROUP",
                    "description": "User Group description",
                    "permissions": null
                },
                {
                    "enhanceId": 6,
                    "name": "MYPROFILE",
                    "description": "My profile description",
                    "permissions": null
                }
            ]
        }
    }

**Error:**

Status error could be different depending on error

.. code-block:: text
    :caption: ``Header:``

    Access Denied 401

.. code-block:: json
    :caption: ``Body:``
       
    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 401,
        "error" : "Password or email doesnt match",
        "message" : "ACCESS_DENIED",
        "path" : "/api/userGroup/all"
    }
