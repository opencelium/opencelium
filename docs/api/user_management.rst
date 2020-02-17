****
User
****

In this section you can find, examples of HTTP requests and responses for 
managing **users**

-----------------------------------------------------------------------------

Create New
==========

.. parsed-literal::
    # Http request
    ``POST`` http://localhost:8080/api/``user`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

    {
        "email": "test@gmail.com",
        "password":"1234",
        "userGroup": 2,
        "userDetail": {
            "name": "Unit",
            "surname": "Test",
            "phoneNumber": "+99830 302 03 23",
            "department": "Tester",
            "organisation": "TestGmbH",
            "salutation": "Salutations"
        }
    }

Response
--------

**Success:**

userGroup.icon could be ``null`` or can hold ``a link`` if userGroup icon is set. 

userDetail.profilePicture will be null becouse image will be set by another request.

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId": 14,
        "email": "test1@gmail.com",
        "userGroup": [
            {
                "enhanceId": 38,
                "role": "USER_ROLE",
                "description": "User role",
                "icon": null,
                "components": [
                    {
                        "enhanceId": 1,
                        "name": "TRANSACTION",
                        "description": "Transaction description",
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
                            "CREATE"
                        ]
                    }
                ]
            }
        ],
        "userDetail": {
            "name": "John",
            "surname": "Doe",
            "phoneNumber": "+99830 302 03 23",
            "department": "Manager",
            "organisation": "Org",
            "salutation": "I freez you!",
            "profilePicture": null,
            "requestTime": null
        }
    }

**Error:**

.. code-block:: json
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : "Internal Error", 
        "message" : "CREATION_ERROR",
        "success" : "false",
        "path" : "/api/user"
    }

Upload Profile Picture of User
------------------------------

Before sending request for uploding User Profile Picture, you have to **send request**
for **Creating User**! After this opertaion you can send request for uploading profile picture.

.. parsed-literal::
    # Http request for picture upload
    ``POST`` http://localhost:8080/api/storage/``profilePicture`` HTTP/1.1

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : multipart/form-data

After user has been created, you will get an email of user. 

+---------+-------------------+
|``Body:``                    |
+=========+===================+
| **Key** | **Value**         |
+---------+-------------------+
| file    | { uploaded file } |
+---------+-------------------+
| email   | { user email }    |
+---------+-------------------+

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
        "success" : "false",
        "path" : "/api/storage/{profilePicture}"
    }

-----------------------------------------------------------------------------

Get All
=======

.. parsed-literal::
    # Http request
    ``GET`` http://localhost:8080/api/user/``all`` HTTP/1.1

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
        "_embedded" : {
            "userResources" : [
                {
                    "enhanceId" : 1,
                    "email" : "admin@gmail.com",
                    "userGroup" : [
                        {
                            "name" : "ROLE_ADMIN",
                            "description" : "Administrator role",
                            "icon" : "http://localhost/resource/icon_hat.png",
                            "components" : [
                                {
                                    "name" : "TRANSACTION",
                                    "description" : "Manages transactions",
                                    "permissions" : [
                                        "READ",
                                        "DELETE",
                                        "CREATE",
                                        "UPDATE"
                                    ]
                                },
                                {
                                    "name" : "USER",
                                    "description" : "Gets component for user management",
                                    "permissions" : [
                                        "READ",
                                        "CREATE"
                                    ]
                                }
                            ]
                        }
                    ],
                    "userDetail" : {
                        "name" : "Unit",
                        "surname" : "Test",
                        "phoneNumber" : "+99830 302 03 24",
                        "department" : "Tester",
                        "organisation" : "TestGmbH",
                        "salutation" : "Salutations",
                        "profilePicture" : "http://localhost/resource/profile.png",
                        "requestTime" : "2018-10-05T03:24:59.000+0000"
                    }
                },
                {
                    "enhanceId": 2,
                    "email": "user@gmail.com",
                    "userGroup": [
                        {
                            "enhanceId" : 2,
                            "name" : "ROLE_USER",
                            "description" : "Administrator role",
                            "icon" : "http://localhost/resource/icon_hat.png"
                            "components" : [
                                {
                                    "name" : "USER",
                                    "description" : "Gets component for user management",
                                    "permissions" : [
                                        "READ",
                                        "CREATE"
                                    ]
                                }
                            ]
                        }
                    ],
                    "userDetail" : {
                        "name" : "User",
                        "surname" : "UserName",
                        "phoneNumber" : "+99830 302 03 23",
                        "department" : "Users",
                        "organisation" : "Locta",
                        "salutation" : "Salutations",
                        "profilePicture" : "http://localhost/resource/profile.png",
                        "requestTime" : "2018-10-05T03:24:59.000+0000"
                    }
                }
            ]
        }
     }

**Error:**

.. code-block:: json
    :caption: ``Body:``

       {
            "timestamp" : "2018-05-24T12:44:26.295+0000",
            "status" : 500,
            "error" : "Authorization error",
            "message" : "ACCESS_DENIED",
            "success" : "false",
            "path" : "/api/user/all"
       }

------------------------------------------------------------------------------

Get One
=======

.. parsed-literal::
    # Http request
    ``GET`` http://localhost:8080/api/user/``{userId}`` HTTP/1.1

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
        "enhanceId" : 2,
        "email" : "user@gmail.com",
        "userGroup" : [
            {
                "enhanceId" : 2,
                "name" : "ROLE_USER",
                "description" : "Administrator role",
                "icon" : "http://localhost/resource/icon.png",
                "components" : [
                    {
                        "enhanceId" : 1,
                        "name" : "USER",
                        "description" : "Gets component for user management",
                        "permissions" : [
                            "READ",
                            "CREATE"
                        ]
                    }
                ]
            }
        ],
        "userDetail" : {
            "name" : "User",
            "surname" : "UserName",
            "phoneNumber" : "+99830 302 03 23",
            "department" : "Users",
            "organisation" : "Locta",
            "salutation" : "Salutations",
            "profilePicture" : "http://localhost/resource/profile.png",
            "requestTime" : "180092832"
        }
    }

**Error:**

.. code-block:: js
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : "Wrong header credentials"
        "message" : "ACCESS_DENIED",
        "success" : "false",
        "path" : "/api/user/{userId}"
    }

-----------------------------------------------------------------------------

Change Password
===============

.. parsed-literal::
    # Http request
    ``PUT`` http://localhost:8080/api/user/{userId}/``password`` HTTP/1.1

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
        "email" : "test@gmail.com",
        "password" : "new password"
    }

Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    200 OK

**Error:**

.. code-block:: text
    :caption: ``Header:``

    500 Internal Error

.. code-block:: js
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : "Token has been expired"
        "message" : "TOKEN_EXPIRED",
        "success" : "false",
        "path" : "/api/user/{userId}/password"
    }

-----------------------------------------------------------------------------

Change Detail
=============

.. parsed-literal::
    # Http request
    ``PUT`` http://localhost:8080/api/user/{userId}/``userDetail`` HTTP/1.1

Request
-------

``profilePicture`` should be set to ``null``.

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId": 1,
        "name": "Unit",
        "surname": "Test",
        "phoneNumber": "+99830 302 03 24",
        "department": "Tester",
        "organisation": "TestGmbH",
        "salutation": "Salutations",
        "profilePicture" : null,
        "requestTime" : "180092832"
    }

if you want to update ``profilePicture`` you have to send following request:

.. parsed-literal::
    # Http request for picture upload
    ``POST`` http://localhost:8080/api/storage/``profilePicture`` HTTP/1.1

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : multipart/form-data

+---------+-------------------+
|``Body:``                    |
+=========+===================+
| **Key** | **Value**         |
+---------+-------------------+
| file    | { uploaded file } |
+---------+-------------------+
| email   | { user email }    |
+---------+-------------------+


Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    201 Created

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId": 1,
        "name": "John",
        "surname": "Doe",
        "phoneNumber": "+99830 302 03 23",
        "department": "Manager Admin test",
        "organisation": "Mason",
        "salutation": "I freez you!",
        "profilePicture": "http://localhost:8080/api/storage/files/d93ea7c0-dd24-4ea9-b40f-cbb43a9b3e21.jpg",
        "requestTime": "2018-07-05T08:10:42.000+0000"
    }

**Error:**

.. code-block:: json
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 500,
        "error" : {
            "message" : "Forbidden"
        },
        "success" : "false",
        "path" : "/api/user/storage/profilePicture"
    }

-----------------------------------------------------------------------------

Change User Group
=================

.. parsed-literal::
    # Http request
    ``PUT`` http://localhost:8080/api/user/{userId}/``userGroup`` HTTP/1.1

Request
-------

For changing user group, you have to put in ``user.userGroup`` an enhanceId of UserGroup.
Get a list of all user_group you can find via request: ``{hostname}/api/userGroup/all``

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId":"3",
        "userGroup": 1
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
        "status" : 500,
        "error" : "Internal Error",
        "message" : "USER_NOT_EXIST",
        "success" : "false",
        "path" : "/api/user/{userId}/userGroup"
    }

-----------------------------------------------------------------------------

Delete
======

.. parsed-literal::
    # Http request
    ``DELETE`` http://localhost:8080/api/user/``{userId}`` HTTP/1.1

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
        "error" : "Access Denied",
        "message" : "ACCESS_DENIED",
        "success" : "false",
        "path" : "/api/user/{userId}"
    }
