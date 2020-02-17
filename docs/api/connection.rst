**********
Connection
**********

In this section you can find, examples of HTTP requests and responses for
managing **Connections**

-----------------------------------------------------------------------------

Create New
==========

.. parsed-literal::
    # Http request
    ``POST`` http://localhost:8080/api/``connection`` HTTP/1.1

Request
-------

.. code-block:: text
    :caption: ``Header:``

    Authorization : Bearer {jwt.token}
    Content-Type : application/json

.. code-block:: json
    :caption: ``Body:``

    {
      "name" : "Connection",
      "description" : "some text here",
      "fromConnector" : 14,
      "toConnector" : 15,
      "connectorList" : [
        {
          "connId" : 14,
          "name" : "i-doit",
          "startAction" : {
            "key" : "#8B0000",
            "type" : "method",
            "name" : "cmdb.objects.read",
            "condition" : null,
            "fieldList" : [
              {
                "fieldType" : "param",
                "name" : "version",
                "value" : "2.0",
                "exchangeType" : "request",
                "subFieldList" : []
              },
              {
                "fieldType" : "param",
                "name" : "method",
                "value" : "cmdb.objects.read",
                "exchangeType" : "request",
                "subFieldList" : []
              },
              {
                "fieldType" : "object",
                "name" : "params",
                "value" : null,
                "exchangeType" : "request",
                "subFieldList" : [
                  {
                    "fieldType" : "object",
                    "name" : "filter",
                    "value" : null,
                    "exchangeType" : "request",
                    "subFieldList" : [
                      {
                        "fieldType" : "param",
                        "name" : "type_title",
                        "value" : "C__OBJTYPE__SERVER",
                        "exchangeType" : "request",
                        "subFieldList" : []
                      }
                    ]
                  }
                ]
              }
            ],
            "bodyAction" : null,
            "nextAction" : {
              "key" : null,
              "type" : "operator",
              "name" : "loop",
              "condition" : "true",
              "fieldList" : [],
              "bodyAction" : {
                "key": "#556B2F",
                "type": "method",
                "name": "cmdb.category.read",
                "condition": null,
                "fieldList": [
                  {
                    "fieldType": "ref",
                    "name": "objID",
                    "value": "$#8B0000.[response].enhanceId",
                    "exchangeType": "request",
                    "subFieldList": []
                  },
                  {
                    "fieldType": "ref",
                    "name": "catecory",
                    "value": "$#8B0000.[response].category",
                    "exchangeType": "request",
                    "subFieldList": []
                  },
                  {
                    "fieldType": "param",
                    "name": "ip_address",
                    "value": null,
                    "exchangeType": "response",
                    "subFieldList": []
                  },
                  {
                    "fieldType": "param",
                    "name": "hostname",
                    "value": null,
                    "exchangeType": "response",
                    "subFieldList": []
                  },
                  {
                    "fieldType": "param",
                    "name": "tags",
                    "value": null,
                    "exchangeType": "response",
                    "subFieldList": []
                  }
                ],
                "bodyAction": null,
                "nextAction": null
              },
              "nextAction" : null
            }
          }
        },
        {
            "connId" : 15,
            "name" : "sensu",
            "startAction" : {
                "key" : "#FF69B4",
                "type" : "method",
                "name" : "getHost",
                "condition" : null,
                "fieldList" : [
                    {
                        "fieldType": "param",
                        "name": "name",
                        "value": null,
                        "exchangeType": "response",
                        "subFieldList": []
                    }
                ],
                "bodyAction" : null,
                "nextAction" : {
                    "key" : null,
                    "type" : "operator",
                    "name" : "if",
                    "condition" : "false",
                    "fieldList" : [],
                    "bodyAction" : {
                        "key": "#DJ22B1",
                        "type": "method",
                        "name": "monitorSystem",
                        "condition": null,
                        "fieldList": [
                            {
                                "fieldType": "param",
                                "name": "IP",
                                "value": "title",
                                "exchangeType": "response",
                                "subFieldList": []
                            },
                            {
                                "fieldType": "param",
                                "name": "Hostname",
                                "value": "title",
                                "exchangeType": "response",
                                "subFieldList": []
                            },
                            {
                                "fieldType": "param",
                                "name": "Tags",
                                "value": "title",
                                "exchangeType": "response",
                                "subFieldList": []
                            }
                        ],
                        "bodyAction": null,
                        "nextAction": null
                    },
                    "nextAction" : null
                }
            }
        }
      ],
      "fieldBinding" : [
        {
          "from" : "#556B2F.ip_address",
          "enhancement" : {
            "name" : "name",
            "description" : "description",
            "expertCode" : "if(title=='In Betrieb'){return 'dev_status';}"
          },
          "to" : "#DJ22B1.IP"
        },
        {
          "from" : "#556B2F.hostname",
          "enhancement" : {
            "name" : "name",
            "description" : "description",
            "expertCode" : "if(title=='In Betrieb'){return 'dev_status';}"
          },
          "to" : "#DJ22B1.Hostname"
        },
        {
          "from" : "#556B2F.tags",
          "enhancement" : {
            "name" : "name",
            "description" : "description",
            "expertCode" : "if(title=='In Betrieb'){return 'dev_status';}"
          },
          "to" : "#DJ22B1.Tags"
        }
      ]
    }

``connectorList`` consist of object that contains identifier of Connector.

Each **Connector** has a field ``startAction`` it means that  some action should

start. Actions could be two types:

1. method

2. operator

Main difference between **method** and **operator** is operator has ``bodyAction`` that

helps to add new **action** inside **operator**. So if you want continue **action** outside of **operator**

you need to fill up ``nextAction`` array with appropriate **actions**;



Response
--------

**Success:**

In response you will get enhanceId of each object that was used in json data.

.. code-block:: text
    :caption: ``Header:``

    200 Ok

.. code-block:: json
    :caption: ``Body:``

    {
        "enhanceId": 311,
        "name": "Connection",
        "description": "some text here",
        "fromConnector": 14,
        "toConnector": 15,
        "connectorList": [
            {
                "enhanceId": 303,
                "name": "i-doit",
                "connId": 14,
                "startAction": {
                    "enhanceId": 306,
                    "key": "#8B0000",
                    "type": "method",
                    "name": "cmdb.objects.read",
                    "condition": null,
                    "nextAction": {
                        "enhanceId": 309,
                        "key": null,
                        "type": "operator",
                        "name": "loop",
                        "condition": "true",
                        "nextAction": null,
                        "bodyAction": {
                            "enhanceId": 310,
                            "key": "#556B2F",
                            "type": "method",
                            "name": "cmdb.category.read",
                            "condition": null,
                            "nextAction": null,
                            "bodyAction": null,
                            "fieldList": [
                                {
                                    "enhanceId": 278,
                                    "fieldType": "ref",
                                    "name": "objID",
                                    "value": "$#8B0000.[response].enhanceId",
                                    "exchangeType": "request",
                                    "subFieldList": []
                                },
                                {
                                    "enhanceId": 279,
                                    "fieldType": "ref",
                                    "name": "catecory",
                                    "value": "$#8B0000.[response].category",
                                    "exchangeType": "request",
                                    "subFieldList": []
                                },
                                {
                                    "enhanceId": 296,
                                    "fieldType": "param",
                                    "name": "ip_address",
                                    "value": null,
                                    "exchangeType": "response",
                                    "subFieldList": []
                                },
                                {
                                    "enhanceId": 297,
                                    "fieldType": "param",
                                    "name": "hostname",
                                    "value": null,
                                    "exchangeType": "response",
                                    "subFieldList": []
                                },
                                {
                                    "enhanceId": 298,
                                    "fieldType": "param",
                                    "name": "tags",
                                    "value": null,
                                    "exchangeType": "response",
                                    "subFieldList": []
                                }
                            ]
                        },
                        "fieldList": []
                    },
                    "bodyAction": null,
                    "fieldList": [
                        {
                            "enhanceId": 233,
                            "fieldType": "param",
                            "name": "version",
                            "value": "2.0",
                            "exchangeType": "request",
                            "subFieldList": []
                        },
                        {
                            "enhanceId": 234,
                            "fieldType": "param",
                            "name": "method",
                            "value": "cmdb.objects.read",
                            "exchangeType": "request",
                            "subFieldList": []
                        },
                        {
                            "enhanceId": 235,
                            "fieldType": "object",
                            "name": "params",
                            "value": null,
                            "exchangeType": "request",
                            "subFieldList": [
                                {
                                    "enhanceId": 276,
                                    "fieldType": "object",
                                    "name": "filter",
                                    "value": null,
                                    "exchangeType": "request",
                                    "subFieldList": [
                                        {
                                            "enhanceId": 277,
                                            "fieldType": "param",
                                            "name": "type_title",
                                            "value": "C__OBJTYPE__SERVER",
                                            "exchangeType": "request",
                                            "subFieldList": []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "enhanceId": 304,
                "name": "sensu",
                "connId": 15,
                "startAction": {
                    "enhanceId": 305,
                    "key": "#FF69B4",
                    "type": "method",
                    "name": "getHost",
                    "condition": null,
                    "nextAction": {
                        "enhanceId": 307,
                        "key": null,
                        "type": "operator",
                        "name": "if",
                        "condition": "false",
                        "nextAction": null,
                        "bodyAction": {
                            "enhanceId": 308,
                            "key": "#DJ22B1",
                            "type": "method",
                            "name": "monitorSystem",
                            "condition": null,
                            "nextAction": null,
                            "bodyAction": null,
                            "fieldList": [
                                {
                                    "enhanceId": 300,
                                    "fieldType": "param",
                                    "name": "IP",
                                    "value": "title",
                                    "exchangeType": "response",
                                    "subFieldList": []
                                },
                                {
                                    "enhanceId": 301,
                                    "fieldType": "param",
                                    "name": "Hostname",
                                    "value": "title",
                                    "exchangeType": "response",
                                    "subFieldList": []
                                },
                                {
                                    "enhanceId": 302,
                                    "fieldType": "param",
                                    "name": "Tags",
                                    "value": "title",
                                    "exchangeType": "response",
                                    "subFieldList": []
                                }
                            ]
                        },
                        "fieldList": []
                    },
                    "bodyAction": null,
                    "fieldList": [
                        {
                            "enhanceId": 299,
                            "fieldType": "param",
                            "name": "name",
                            "value": null,
                            "exchangeType": "response",
                            "subFieldList": []
                        }
                    ]
                }
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
        "message" : "CREATION_ERROR",
        "success" : "false",
        "path" : "/api/connection/all"
    }

If you look up to the neo4j database you will find visual representation of created data.

.. image:: img/graph.png
    :align: center


Get all Connection
==================

.. parsed-literal::
    # Http request to create permission
    ``PUT`` http://localhost:8080/api/connection/``all`` HTTP/1.1

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
            "connectionNodes": [
                {
                    "enhanceId": 41,
                    "title": "connectionTitle",
                    "description": "ConnectionDescription",
                    "fromConnector": 1,
                    "toConnector": 2
                },
                {
                    "enhanceId": 121,
                    "title": "connectionTitle 1",
                    "description": "ConnectionDescription 1",
                    "fromConnector": 1,
                    "toConnector": 2
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
        "error" : "Password or email doesn't match",
        "message" : "ACCESS_DENIED",
        "path" : "/api/connection/all"
    }


Get one Connection
==================

.. parsed-literal::
    # Http request to create permission
    ``PUT`` http://localhost:8080/api/connection/``{connectionId}`` HTTP/1.1

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
        "enhanceId": 41,
        "title": "Best transaction",
        "description": "Description",
        "fromConnector": 1,
        "toConnector": 2,
        "connectorList": []
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
        "path" : "/api/connection/all"
    }

Delete Connection
=================

When Connection deleted it also delete all his children

.. parsed-literal::
    # Http request
    ``DELETE`` http://localhost:8080/api/connection/``{connectionId}`` HTTP/1.1

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
        "path" : "/api/connection"
    }

