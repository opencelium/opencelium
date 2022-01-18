*********
Scheduler
*********


Scheduler helps you to manage time when transaction will be executed.

-----------------------------------------------------------------------------

Get Periodicity List
====================

.. parsed-literal::
    # Http request to get list of periodicities
    ``GET`` http://localhost:8080/api/scheduler/```periodicity/all``` HTTP/1.1

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
            "periodicityResources": [
                {
                    "enhanceId": 1,
                    "name": "daily",
                    "description": "Iteration each day"
                },
                {
                    "enhanceId": 2,
                    "name": "weekly",
                    "description": "Iteration each week"
                },
                {
                    "enhanceId": 3,
                    "name": "monthly",
                    "description": "Iteration each month"
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
        "error" : "Internal Error",
        "message" : "WRONG_COMPONENT",
        "success" : "false",
        "path" : "/api/scheduler/periodicity/all"
    }


Create new
==========

.. parsed-literal::
    # Http request to create scheduler
    ``POST`` http://localhost:8080/api/``scheduler`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

    {
        "connectionId" : 66,
        "periodicityId" : 2,
        "color" : "#FFFFFF",
        "fromDate" : "2018-09-04T13:57:32.000+0000",
        "tillDate" : "2018-09-04T13:57:32.000+0000",
        "status" : false
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
        "enhanceId": 5,
        "connectionId": 407,
        "periodicityId": {
            "enhanceId": 1,
            "name": "daily",
            "description": "Iteration each day"
        },
        "color": "#FFFFFF",
        "fromDate": "2018-09-04T13:57:32.000+0000",
        "tillDate": "2018-09-04T13:57:32.000+0000",
        "status": false
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
        "error" : "Internal Error",
        "message" : "WRONG_COMPONENT",
        "success" : "false",
        "path" : "/api/scheduler"
    }

Update scheduler
================

.. parsed-literal::
    # Http request to update scheduler
    ``PUT`` http://localhost:8080/api/scheduler/``{schedulerId}`` HTTP/1.1

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
        "connectionId" : 66,
        "periodicityId" : 2,
        "title" : "Title here";
        "color" : "#FFFFFF",
        "fromDate" : "2018-09-04T13:57:32.000+0000",
        "tillDate" : "2018-09-04T13:57:32.000+0000",
        "status" : false
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
        "path" : "/api/scheduler/{schedulerId}"
    }

Get scheduler list
==================

.. parsed-literal::
    # Http request to get all scheduler list
    ``GET`` http://localhost:8080/api/scheduler/``all`` HTTP/1.1

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
            "schedulerResources": [
                {
                    "enhanceId": 5,
                    "transaction": {
                        "enhanceId": 407,
                        "name": "Connection",
                        "description": "some text here",
                        "fromConnector": 14,
                        "toConnector": 15
                    },
                    "periodicity": {
                        "enhanceId": 1,
                        "name": "daily",
                        "description": "Iteration each day"
                    },
                    "title" : "Title here"
                    "color": "#FFFFFF",
                    "fromDate": "2018-09-04T13:57:32.000+0000",
                    "tillDate": "2018-09-04T13:57:32.000+0000",
                    "status": false
                }
            ]
        }
    }

**Error:**

Status error could be different depending on exception

.. code-block:: text
    :caption: ``Header:``

    Access Denied 401

.. code-block:: json
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 401,
        "error" : "Password or email doesn't match",
        "message" : "ACCESS_DENIED",
        "path" : "/api/schedule/all"
    }

Get scheduler
=============

.. parsed-literal::
    # Http request to get all scheduler
    ``GET`` http://localhost:8080/api/scheduler/``{schedulerId}`` HTTP/1.1

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
        "enhanceId": 4,
        "transaction": {
            "enhanceId": 163,
            "title": "Best transaction",
            "description": "Description",
            "fromConnector": 1,
            "toConnector": 2,
            "connectorList": []
        },
        "periodicity": {
            "enhanceId": 2,
            "name": "weekly",
            "description": "Iteration each week"
        },
        "color": "#FFFFFF",
        "fromDate": "2018-09-04T13:57:32.000+0000",
        "tillDate": "2018-09-04T13:57:32.000+0000",
        "status": false
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
        "path" : "/api/scheduler/{schedulerId}"
    }

Delete scheduler
================


.. parsed-literal::
    # Http request
    ``DELETE`` http://localhost:8080/api/scheduler/``{schedulerId}`` HTTP/1.1

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
        "message" : "SCHEDULER_NOT_DELETED",
        "path" : "/api/scheduler"
    }
