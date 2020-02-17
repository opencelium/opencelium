**********
Permission
**********


Here you can manage only permission without linking to UserGroup

-----------------------------------------------------------------------------

Create New
==========

.. parsed-literal::
    # Http request to create permission
    ``POST`` http://localhost:8080/api/``permission`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

    {
        "name": "READ",
	    "description": "Read operation"
    }

Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    201 Created

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
        "message" : "WRONG_PERMISSION",
        "success" : "false",
        "path" : "/api/permission"
    }

Update permission
=================

.. parsed-literal::
    # Http request to create permission
    ``PUT`` http://localhost:8080/api/permission/``{permissionId}`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId" : "{permissionId}",
	    "name": "READ",
	    "description": "Read operation"
    }

Response
--------

**Success:**

.. code-block:: text
    :caption: ``Header:``

    201 Created

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
        "message" : "CHANGE_DENIED",
        "success" : "false",
        "path" : "/api/permission/{permissionId}"
    }

Get all permission list
=======================

.. parsed-literal::
    # Http request to create permission
    ``PUT`` http://localhost:8080/api/permission/``all`` HTTP/1.1

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

Delete Permission
=================

Permission could be delete if it is not linked to UserGroup. Otherwise you will
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
