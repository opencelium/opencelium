**********
User group
**********

User group contains roles that defines permission for resources

-----------------------------------------------------------------------------

Create UserGroup
================

Creates new role, also binds components and permissions

.. parsed-literal::
    # Http request
    ``POST`` http://localhost:8080/api/``userGroup`` HTTP/1.1

Request
-------

``userGroup.icon``` should be null. Because icon upload will be send by another request

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. parsed-literal::
    # List of permissions you can get from following request
    ``POST`` http://localhost:8080/api/``permission``/all HTTP/1.1

    **Response:**
    {
        "_embedded": {
            "permissionResources": [
                {
                    "enhanceId": 1,
                    "name": "CREATE",
                    "description": "Create operation"
                },
                {
                    "enhanceId": 2,
                    "name": "UPDATE",
                    "description": "Update operation"
                },
                {
                    "enhanceId": 3,
                    "name": "DELETE",
                    "description": "Delete operation"
                },
                {
                    "enhanceId": 4,
                    "name": "READ",
                    "description": "Read operation"
                }
            ]
        }
    }

.. parsed-literal::
    # List of components you will find from following request
    ``POST`` http://localhost:8080/api/``component``/all HTTP/1.1

    **Response:**
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

Whole json for creating UserGroup is look like:

.. code-block:: json
    :caption: ``Body:``

    {
        "role": "ADMIN_ROLE",
        "description": "User role",
        "icon": null,
        "components": [
            {
                "enhanceId":1,
                "permissions": [
                    "READ",
                    "CREATE",
                    "UPDATE"
                ]
            },
            {
                "enhanceId":2,
                "permissions": [
                    "READ",
                    "CREATE",
                    "UPDATE"
                ]
            }
        ]
    }

Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    201 Created

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId": 2,
        "role": "USER_ROLE",
        "description": "User role",
        "icon": null,
        "components": [
            {
                "enhanceId": 2,
                "name": "CONNECTOR",
                "description": "Connector description",
                "permissions": [
                    "READ",
                    "CREATE",
                    "UPDATE"
                ]
            },
            {
                "enhanceId": 1,
                "name": "CONNECTION",
                "description": "Connection description",
                "permissions": [
                    "READ",
                    "CREATE",
                    "UPDATE"
                ]
            }
        ]
    }

**Error:**

.. code-block:: json
    :caption: ``Body:``
       
    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 404,
        "error" : "Page not found",
        "message" : "NOT_FOUND",
        "path" : "/api/userGroup"
    }


Upload UserGroup Icon
---------------------

Before sending request for uploading UserGroup Icon, you have to **send request**
for **Creating UserGroup** or be sure that **UserGroup** has been created already!
After this operation you can send request for uploading Icon.

.. parsed-literal::
    # Http request for picture upload
    ``POST`` http://localhost:8080/api/storage/``groupIcon`` HTTP/1.1

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : multipart/form-data

+-------------+-------------------+
|``Body:``                        |
+=============+===================+
| **Key**     | **Value**         |
+-------------+-------------------+
| file        | { uploaded file } |
+-------------+-------------------+
| userGroupId | { user group Id } |
+-------------+-------------------+

If error will occur you will get ``response``. 

**Error:**

.. code-block:: text
    :caption: ``Header:``

    Internal Error 500

.. code-block:: json
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : "Internal Error", 
        "message" : "WRONG_FORMAT",
        "path" : "/api/user/all"
    }    

-----------------------------------------------------------------------------

Get All UserGroups
==================

.. parsed-literal::
    # Http request
    ``GET`` http://localhost:8080/api/userGroup/``all`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

Response
--------

**Success:**

.. code-block:: json
    :caption: ``Body:``

    {
        "_embedded": {
            "userGroupResources": [
                {
                    "enhanceId": 1,
                    "role": "ROLE_ADMIN",
                    "description": "Admin role",
                    "icon": null,
                    "components": [
                        {
                            "enhanceId": 4,
                            "name": "USER",
                            "description": "User description",
                            "permissions": [
                                "READ",
                                "DELETE",
                                "CREATE",
                                "UPDATE"
                            ]
                        },
                        {
                            "enhanceId": 6,
                            "name": "MYPROFILE",
                            "description": "My profile description",
                            "permissions": [
                                "READ",
                                "DELETE",
                                "CREATE",
                                "UPDATE"
                            ]
                        },
                        {
                            "enhanceId": 3,
                            "name": "EVENT",
                            "description": "Event description",
                            "permissions": [
                                "READ",
                                "DELETE",
                                "CREATE",
                                "UPDATE"
                            ]
                        },
                        {
                            "enhanceId": 1,
                            "name": "CONNECTION",
                            "description": "Connection description",
                            "permissions": [
                                "READ",
                                "DELETE",
                                "CREATE",
                                "UPDATE"
                            ]
                        },
                        {
                            "enhanceId": 5,
                            "name": "USERGROUP",
                            "description": "User Group description",
                            "permissions": [
                                "READ",
                                "DELETE",
                                "CREATE",
                                "UPDATE"
                            ]
                        },
                        {
                            "enhanceId": 2,
                            "name": "CONNECTOR",
                            "description": "Connector description",
                            "permissions": [
                                "READ",
                                "DELETE",
                                "CREATE",
                                "UPDATE"
                            ]
                        }
                    ]
                },
                {
                    "enhanceId": 2,
                    "role": "USER_ROLE",
                    "description": "User role",
                    "icon": null,
                    "components": [
                        {
                            "enhanceId": 1,
                            "name": "CONNECTION",
                            "description": "Connection description",
                            "permissions": [
                                "READ",
                                "CREATE",
                                "UPDATE"
                            ]
                        },
                        {
                            "enhanceId": 2,
                            "name": "CONNECTOR",
                            "description": "Connector description",
                            "permissions": [
                                "READ",
                                "CREATE",
                                "UPDATE"
                            ]
                        }
                    ]
                }
            ]
        }
    }

**Error:**

.. code-block:: text
    :caption: ``Header:``

    Internal Error 500

.. code-block:: json
    :caption: ``Body:``
       
    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : "Password or email doesnt match",
        "message" : "INTERNAL_ERROR",
        "path" : "/api/userGroup/all"
    }

-----------------------------------------------------------------------------

Get UserGroup
=============

Retrieve user group by Id.

.. parsed-literal::
    # Http request
    ``GET`` http://localhost:8080/api/userGroup/``{userGroupId}`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

Response
--------

**Success:**

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId": 2,
        "role": "USER_ROLE",
        "description": "User role",
        "icon": null,
        "components": [
            {
                "enhanceId": 2,
                "name": "CONNECTOR",
                "description": "Connector description",
                "permissions": [
                    "READ",
                    "CREATE",
                    "UPDATE"
                ]
            },
            {
                "enhanceId": 1,
                "name": "CONNECTION",
                "description": "Connection description",
                "permissions": [
                    "READ",
                    "CREATE",
                    "UPDATE"
                ]
            }
        ]
    }

**Error:**

.. code-block:: json
    :caption: ``Body:``
       
    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : "Internal Error",
        "message" : "ROLE_NOT_EXIST",
        "path" : "/api/userGroup/{userGroupId}"
    }
 
-----------------------------------------------------------------------------

Delete UserGroup
================

UserGroup could be delete if it is not linked to User. Otherwise you will
get an error

.. parsed-literal::
    # Http request
    ``DELETE`` http://localhost:8080/api/``{userGroupId}`` HTTP/1.1

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

    204 No Content

**Error:**

.. code-block:: json
    :caption: ``Body:``
       
    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : "Internal Error",
        "message" : "USERGROUP_NOT_DELETED",
        "path" : "/api/userGroup"
    }

-----------------------------------------------------------------------------

Change UserGroup
================

Change User Group, .

.. parsed-literal::
    # Http request
    ``PUT`` http://localhost:8080/api/{userGroupId}/``component`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``
    
    {
        "enhanceId" : 1,
        "name": "ROLE_ADMIN",
        "description": "Administrator role",
        "icon": null,
        "components": [
            {
                "enhanceId" : 1,
                "permissions": [
                    "READ",
                    "DELETE",
                    "CREATE",
                    "UPDATE"
                ]
            },
            {
                "enhanceId":2,
                "permissions": [
                    "READ",
                    "CREATE"
                ]
            }
        ]
    }

Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    201 Created

**Error:**

.. code-block:: json
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 204,
        "error" : "",
        "message" : "USERGROUP_NOT_CHANGED",
        "path" : "/api/user/all"
    }

For update ``User Group Icon`` you have to send following request:

.. parsed-literal::
    # Http request for user group icon upload
    ``POST`` http://localhost:8080/api/storage/``groupIcon`` HTTP/1.1

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : multipart/form-data

+-------------+-------------------+
|``Body:``                        |
+=============+===================+
| **Key**     | **Value**         |
+-------------+-------------------+
| file        | { uploaded file } |
+-------------+-------------------+
| userGroupId | { user group Id } |
+-------------+-------------------+



