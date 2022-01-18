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
        "title": "idoit2CheckMK",
        "description": "",
        "fromConnector": {
          "connectorId": 14,
          "invoker": {
            "name": "i-doit",
            "links": []
          },
          "methods": [
            {
              "nodeId": null,
              "index": "0",
              "name": "cmdb.objects.read",
              "color": "#FFCFB5",
              "request": {
                "nodeId": null,
                "endpoint": "{url}",
                "method": "POST",
                "header": null,
                "body": {
                  "method": "cmdb.objects.read",
                  "id": "1",
                  "params": {
                    "filter": {
                      "sys_id": "",
                      "firstname": "",
                      "ids": [],
                      "type_title": "",
                      "title": "",
                      "type": [
                        "59"
                      ],
                      "email": "",
                      "lastname": ""
                    },
                    "apikey": "{apikey}",
                    "limit": "",
                    "order_by": "",
                    "language": "",
                    "sort": ""
                  },
                  "version": "2.0"
                },
                "links": []
              },
              "response": {
                "nodeId": null,
                "name": "response",
                "success": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result": [
                      {
                        "cmdb_status_title": "",
                        "image": "",
                        "sysid": "",
                        "created": "",
                        "type_title": "",
                        "cmdb_status": "",
                        "id": "",
                        "type": "",
                        "title": "",
                        "updated": "",
                        "type_group_title": "",
                        "status": ""
                      }
                    ],
                    "id": "",
                    "jsonrpc": ""
                  },
                  "links": []
                },
                "fail": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "error": {
                      "code": "",
                      "data": "",
                      "message": ""
                    }
                  },
                  "links": []
                },
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "index": "1_0",
              "name": "cmdb.category.read",
              "color": "#C77E7E",
              "request": {
                "nodeId": null,
                "endpoint": "{url}",
                "method": "POST",
                "header": null,
                "body": {
                  "method": "cmdb.category.read",
                  "id": "1",
                  "params": {
                    "apikey": "{apikey}",
                    "objID": "#FFCFB5.(response).success.result[].id",
                    "language": "",
                    "category": "C__CATG__IP"
                  },
                  "version": "2.0"
                },
                "links": []
              },
              "response": {
                "nodeId": null,
                "name": "response",
                "success": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result": [
                      {
                        "hostname": "",
                        "objID": "",
                        "id": ""
                      }
                    ]
                  },
                  "links": []
                },
                "fail": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "error": {
                      "code": "",
                      "data": "",
                      "message": ""
                    }
                  },
                  "links": []
                },
                "links": []
              },
              "links": []
            }
          ],
          "operators": [
            {
              "nodeId": null,
              "type": "loop",
              "index": "1",
              "condition": {
                "relationalOperator": "",
                "leftStatement": {
                  "color": "#FFCFB5",
                  "field": "success.result[]",
                  "type": "response",
                  "rightPropertyValue": "",
                  "links": []
                },
                "rightStatement": null,
                "links": []
              },
              "links": []
            }
          ],
          "links": []
        },
        "toConnector": {
          "connectorId": 13,
          "invoker": {
            "name": "CheckMK",
            "links": []
          },
          "methods": [
            {
              "nodeId": null,
              "index": "0_0_0_0_0",
              "name": "get_host",
              "color": "#98BEC7",
              "request": {
                "nodeId": null,
                "endpoint": "{url}?_username={_username}&_secret={_secret}&action=get_host",
                "method": "POST",
                "header": null,
                "body": {
                  "hostname": "#C77E7E.(response).success.result[]"
                },
                "links": []
              },
              "response": {
                "nodeId": null,
                "name": "response",
                "success": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result": {
                      "hostname": ""
                    }
                  },
                  "links": []
                },
                "fail": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result_code": "1"
                  },
                  "links": []
                },
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "index": "0_0_0_0_1_0",
              "name": "add_host",
              "color": "#6477AB",
              "request": {
                "nodeId": null,
                "endpoint": "{url}?_username={_username}&_secret={_secret}&action=add_host",
                "method": "POST",
                "header": null,
                "body": {
                  "hostname": "#C77E7E.(response).success.result[]",
                  "folder": "oc/example",
                  "attributes": {
                    "ipaddress": "#C77E7E.(response).success.result[]",
                    "site": "checkmk"
                  }
                },
                "links": []
              },
              "response": {
                "nodeId": null,
                "name": "response",
                "success": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result": ""
                  },
                  "links": []
                },
                "fail": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result_code": "1"
                  },
                  "links": []
                },
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "index": "0_0_0_0_2_0",
              "name": "edit_host",
              "color": "#9EC798",
              "request": {
                "nodeId": null,
                "endpoint": "{url}?_username={_username}&_secret={_secret}&action=edit_host",
                "method": "POST",
                "header": null,
                "body": {
                  "hostname": "#C77E7E.(response).success.result[]",
                  "folder": "oc/example",
                  "attributes": {
                    "ipaddress": "#C77E7E.(response).success.result[]",
                    "site": "checkmk"
                  }
                },
                "links": []
              },
              "response": {
                "nodeId": null,
                "name": "response",
                "success": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result": ""
                  },
                  "links": []
                },
                "fail": {
                  "nodeId": null,
                  "status": "200",
                  "header": null,
                  "body": {
                    "result_code": "1"
                  },
                  "links": []
                },
                "links": []
              },
              "links": []
            }
          ],
          "operators": [
            {
              "nodeId": null,
              "type": "loop",
              "index": "0",
              "condition": {
                "relationalOperator": "",
                "leftStatement": {
                  "color": "#FFCFB5",
                  "field": "success.result[]",
                  "type": "response",
                  "rightPropertyValue": "",
                  "links": []
                },
                "rightStatement": null,
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "type": "if",
              "index": "0_0",
              "condition": {
                "relationalOperator": "NotEmpty",
                "leftStatement": {
                  "color": "#C77E7E",
                  "field": "success.result[]",
                  "type": "response",
                  "rightPropertyValue": "",
                  "links": []
                },
                "rightStatement": null,
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "type": "if",
              "index": "0_0_0",
              "condition": {
                "relationalOperator": "NotNull",
                "leftStatement": {
                  "color": "#C77E7E",
                  "field": "success.result[0].hostname",
                  "type": "response",
                  "rightPropertyValue": "",
                  "links": []
                },
                "rightStatement": null,
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "type": "if",
              "index": "0_0_0_0",
              "condition": {
                "relationalOperator": "NotNull",
                "leftStatement": {
                  "color": "#C77E7E",
                  "field": "success.result[0].ipv4_address.ref_title",
                  "type": "response",
                  "rightPropertyValue": "",
                  "links": []
                },
                "rightStatement": null,
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "type": "if",
              "index": "0_0_0_0_1",
              "condition": {
                "relationalOperator": "=",
                "leftStatement": {
                  "color": "#98BEC7",
                  "field": "success.result",
                  "type": "response",
                  "rightPropertyValue": "",
                  "links": []
                },
                "rightStatement": {
                  "color": "",
                  "field": "Check_MK exception: No such host",
                  "type": "",
                  "rightPropertyValue": "",
                  "links": []
                },
                "links": []
              },
              "links": []
            },
            {
              "nodeId": null,
              "type": "if",
              "index": "0_0_0_0_2",
              "condition": {
                "relationalOperator": "!=",
                "leftStatement": {
                  "color": "#98BEC7",
                  "field": "success.result",
                  "type": "response",
                  "rightPropertyValue": "",
                  "links": []
                },
                "rightStatement": {
                  "color": "",
                  "field": "Check_MK exception: No such host",
                  "type": "",
                  "rightPropertyValue": "",
                  "links": []
                },
                "links": []
              },
              "links": []
            }
          ],
          "links": []
        },
        "fieldBinding": [
          {
            "from": [
              {
                "color": "#C77E7E",
                "type": "response",
                "field": "success.result[]",
                "links": []
              }
            ],
            "enhancement": {
              "enhanceId": null,
              "name": "",
              "description": "",
              "expertCode": "RESULT_VAR = VAR_0[0].hostname;",
              "expertVar": "//var RESULT_VAR = #98BEC7.(request).hostname;\n//var VAR_0 = #C77E7E.(response).success.result[];",
              "simpleCode": null,
              "language": "js",
              "links": []
            },
            "to": [
              {
                "color": "#98BEC7",
                "type": "request",
                "field": "hostname",
                "links": []
              }
            ],
            "links": []
          },
          {
            "from": [
              {
                "color": "#C77E7E",
                "type": "response",
                "field": "success.result[]",
                "links": []
              }
            ],
            "enhancement": {
              "enhanceId": null,
              "name": "",
              "description": "",
              "expertCode": "RESULT_VAR = VAR_0[0].hostname;",
              "expertVar": "//var RESULT_VAR = #6477AB.(request).hostname;\n//var VAR_0 = #C77E7E.(response).success.result[];",
              "simpleCode": null,
              "language": "js",
              "links": []
            },
            "to": [
              {
                "color": "#6477AB",
                "type": "request",
                "field": "hostname",
                "links": []
              }
            ],
            "links": []
          },
          {
            "from": [
              {
                "color": "#C77E7E",
                "type": "response",
                "field": "success.result[]",
                "links": []
              }
            ],
            "enhancement": {
              "enhanceId": null,
              "name": "",
              "description": "",
              "expertCode": "RESULT_VAR = VAR_0[0].ipv4_address.ref_title;\n",
              "expertVar": "//var RESULT_VAR = #6477AB.(request).attributes.ipaddress;\n//var VAR_0 = #C77E7E.(response).success.result[];",
              "simpleCode": null,
              "language": "js",
              "links": []
            },
            "to": [
              {
                "color": "#6477AB",
                "type": "request",
                "field": "attributes.ipaddress",
                "links": []
              }
            ],
            "links": []
          },
          {
            "from": [
              {
                "color": "#C77E7E",
                "type": "response",
                "field": "success.result[]",
                "links": []
              }
            ],
            "enhancement": {
              "enhanceId": null,
              "name": "",
              "description": "",
              "expertCode": "RESULT_VAR = VAR_0[0].hostname;",
              "expertVar": "//var RESULT_VAR = #9EC798.(request).hostname;\n//var VAR_0 = #C77E7E.(response).success.result[];",
              "simpleCode": null,
              "language": "js",
              "links": []
            },
            "to": [
              {
                "color": "#9EC798",
                "type": "request",
                "field": "hostname",
                "links": []
              }
            ],
            "links": []
          },
          {
            "from": [
              {
                "color": "#C77E7E",
                "type": "response",
                "field": "success.result[]",
                "links": []
              }
            ],
            "enhancement": {
              "enhanceId": null,
              "name": "",
              "description": "",
              "expertCode": "RESULT_VAR = VAR_0[0].ipv4_address.ref_title;",
              "expertVar": "//var RESULT_VAR = #9EC798.(request).attributes.ipaddress;\n//var VAR_0 = #C77E7E.(response).success.result[];",
              "simpleCode": null,
              "language": "js",
              "links": []
            },
            "to": [
              {
                "color": "#9EC798",
                "type": "request",
                "field": "attributes.ipaddress",
                "links": []
              }
            ],
            "links": []
          }
        ],
        "links": []
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
        "connectionId": 113,
        "title": "idoit2CheckMK",
        "description": "",
        "fromConnector": {
            "connectorId": 14,
            "title": "i-doit2",
            "invoker": {
                "name": "i-doit",
                "description": "I-doit Description",
                "hint": "hint text",
                "icon": "http://localhost:9090/api/storage/files/i-doit.png",
                "authType": "apikey",
                "requiredData": [
                    "url",
                    "apikey"
                ],
                "operations": [
                    {
                        "name": "idoit.version",
                        "type": "test",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "idoit.version",
                                "id": "1",
                                "params": {
                                    "apikey": "{apikey}",
                                    "language": "de"
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": ""
                                },
                                "body": {
                                    "result": {
                                        "version": ""
                                    }
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.objects.read",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.objects.read",
                                "id": "1",
                                "params": {
                                    "filter": {
                                        "sys_id": "",
                                        "firstname": "",
                                        "ids": [],
                                        "type_title": "",
                                        "type": [],
                                        "title": "",
                                        "email": "",
                                        "lastname": ""
                                    },
                                    "apikey": "{apikey}",
                                    "limit": "",
                                    "order_by": "",
                                    "language": "",
                                    "sort": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": [
                                        {
                                            "cmdb_status_title": "",
                                            "image": "",
                                            "sysid": "",
                                            "created": "",
                                            "type_title": "",
                                            "id": "",
                                            "cmdb_status": "",
                                            "title": "",
                                            "type": "",
                                            "updated": "",
                                            "type_group_title": "",
                                            "status": ""
                                        }
                                    ],
                                    "id": "",
                                    "jsonrpc": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.object.read",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.object.read",
                                "id": "1",
                                "params": {
                                    "apikey": "{apikey}",
                                    "language": "",
                                    "id": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": {
                                        "type_icon": "",
                                        "cmdb_status_title": "",
                                        "image": "",
                                        "sysid": "",
                                        "created": "",
                                        "objecttyp": "",
                                        "type_title": "",
                                        "id": "",
                                        "cmdb_status": "",
                                        "title": "",
                                        "updated": "",
                                        "status": ""
                                    },
                                    "id": "",
                                    "jsonrpc": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.object.create",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.object.create",
                                "id": "1",
                                "params": {
                                    "apikey": "{apikey}",
                                    "language": "",
                                    "cmdb_status": "",
                                    "type": "",
                                    "title": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": {
                                        "eventMessage": "",
                                        "id": "",
                                        "status": ""
                                    },
                                    "id": "",
                                    "jsonrpc": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.object.delete",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.object.delete",
                                "id": "1",
                                "params": {
                                    "apikey": "{apikey}",
                                    "language": "",
                                    "id": "",
                                    "status": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": {
                                        "eventMessage": ""
                                    },
                                    "id": "",
                                    "jsonrpc": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.object.quickpurge",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.object.quickpurge",
                                "id": "1",
                                "params": {
                                    "apikey": "{apikey}",
                                    "id": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": {
                                        "eventMessage": ""
                                    },
                                    "id": "",
                                    "jsonrpc": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.category.read",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.category.read",
                                "id": "1",
                                "params": {
                                    "apikey": "{apikey}",
                                    "objID": "",
                                    "language": "",
                                    "category": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": [
                                        {
                                            "hostname": "",
                                            "objID": "",
                                            "id": ""
                                        }
                                    ]
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.category.update",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.category.update",
                                "id": "1",
                                "params": {
                                    "data": "",
                                    "apikey": "{apikey}",
                                    "objID": "",
                                    "language": "",
                                    "category": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": [
                                        {
                                            "hostname": "",
                                            "objID": "",
                                            "id": ""
                                        }
                                    ]
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    },
                    {
                        "name": "cmdb.category.create",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": {
                                "method": "cmdb.category.create",
                                "id": "1",
                                "params": {
                                    "data": {
                                        "title": "",
                                        "manufacturer": ""
                                    },
                                    "apikey": "{apikey}",
                                    "objID": "",
                                    "language": "",
                                    "category": ""
                                },
                                "version": "2.0"
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": [
                                        {
                                            "eventMessage": "",
                                            "id": ""
                                        }
                                    ]
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "error": {
                                        "eventMessage": "",
                                        "code": "",
                                        "data": ""
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            "methods": [
                {
                    "nodeId": 1211,
                    "index": "0",
                    "name": "cmdb.objects.read",
                    "color": "#FFCFB5",
                    "request": {
                        "nodeId": 1205,
                        "endpoint": "{url}",
                        "method": "POST",
                        "header": null,
                        "body": {
                            "method": "cmdb.objects.read",
                            "id": "1",
                            "params": {
                                "filter": {
                                    "sys_id": "",
                                    "firstname": "",
                                    "ids": [],
                                    "type_title": "",
                                    "title": "",
                                    "type": [
                                        "59"
                                    ],
                                    "email": "",
                                    "lastname": ""
                                },
                                "apikey": "{apikey}",
                                "limit": "",
                                "order_by": "",
                                "language": "",
                                "sort": ""
                            },
                            "version": "2.0"
                        }
                    },
                    "response": {
                        "nodeId": 1820,
                        "name": "response",
                        "success": {
                            "nodeId": 1233,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result": [
                                    {
                                        "cmdb_status_title": "",
                                        "image": "",
                                        "sysid": "",
                                        "created": "",
                                        "type_title": "",
                                        "cmdb_status": "",
                                        "id": "",
                                        "type": "",
                                        "title": "",
                                        "updated": "",
                                        "type_group_title": "",
                                        "status": ""
                                    }
                                ],
                                "id": "",
                                "jsonrpc": ""
                            }
                        },
                        "fail": {
                            "nodeId": 1235,
                            "status": "200",
                            "header": null,
                            "body": {
                                "error": {
                                    "code": "",
                                    "data": "",
                                    "message": ""
                                }
                            }
                        }
                    }
                },
                {
                    "nodeId": 1212,
                    "index": "1_0",
                    "name": "cmdb.category.read",
                    "color": "#C77E7E",
                    "request": {
                        "nodeId": 1204,
                        "endpoint": "{url}",
                        "method": "POST",
                        "header": null,
                        "body": {
                            "method": "cmdb.category.read",
                            "id": "1",
                            "params": {
                                "apikey": "{apikey}",
                                "objID": "#FFCFB5.(response).success.result[].id",
                                "language": "",
                                "category": "C__CATG__IP"
                            },
                            "version": "2.0"
                        }
                    },
                    "response": {
                        "nodeId": 1821,
                        "name": "response",
                        "success": {
                            "nodeId": 1238,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result": [
                                    {
                                        "hostname": "",
                                        "objID": "",
                                        "id": ""
                                    }
                                ]
                            }
                        },
                        "fail": {
                            "nodeId": 1236,
                            "status": "200",
                            "header": null,
                            "body": {
                                "error": {
                                    "code": "",
                                    "data": "",
                                    "message": ""
                                }
                            }
                        }
                    }
                }
            ],
            "operators": [
                {
                    "nodeId": 406,
                    "type": "loop",
                    "index": "1",
                    "condition": {
                        "relationalOperator": null,
                        "leftStatement": {
                            "color": "#FFCFB5",
                            "field": "success.result[]",
                            "type": "response",
                            "rightPropertyValue": ""
                        },
                        "rightStatement": null
                    }
                }
            ]
        },
        "toConnector": {
            "connectorId": 13,
            "title": "checkMK",
            "invoker": {
                "name": "CheckMK",
                "description": "Checkmk is a leading tool for Infrastructure and Application Monitoring. Simple configuration, scalable, flexible. Open Source and Enterprise.",
                "hint": "CheckMK is a monitoring tool. Read api documentation https://checkmk.de/cms_web_api_references.html",
                "icon": "http://localhost:9090/api/storage/files/checkmk.png",
                "authType": "endpointAuth",
                "requiredData": [
                    "url",
                    "_username",
                    "_secret"
                ],
                "operations": [
                    {
                        "name": "connection_check",
                        "type": "test",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}",
                            "method": "GET",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": null
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": "",
                                    "result_code": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "text/plain"
                                },
                                "body": null
                            }
                        }
                    },
                    {
                        "name": "get_all_hosts",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}&action=get_all_hosts",
                            "method": "GET",
                            "header": {
                                "Content-Type": "application/json"
                            },
                            "body": null
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result_code": "1"
                                }
                            }
                        }
                    },
                    {
                        "name": "get_host_names",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}&action=get_host_names",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": null
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": []
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result_code": "1"
                                }
                            }
                        }
                    },
                    {
                        "name": "get_host",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}&action=get_host",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "hostname": ""
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": {
                                        "hostname": ""
                                    }
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result_code": "1"
                                }
                            }
                        }
                    },
                    {
                        "name": "add_host",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}&action=add_host",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "hostname": "",
                                "folder": "",
                                "attributes": {
                                    "ipaddress": "",
                                    "site": ""
                                }
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result_code": "1"
                                }
                            }
                        }
                    },
                    {
                        "name": "edit_host",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}&action=edit_host",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "hostname": "",
                                "folder": "",
                                "attributes": {
                                    "ipaddress": "",
                                    "site": ""
                                }
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result_code": "1"
                                }
                            }
                        }
                    },
                    {
                        "name": "delete_host",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}&action=delete_host",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "hostname": ""
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result_code": "1"
                                }
                            }
                        }
                    },
                    {
                        "name": "activate_changes",
                        "type": "",
                        "request": {
                            "nodeId": null,
                            "endpoint": "{url}?_username={_username}&_secret={_secret}&action=activate_changes",
                            "method": "POST",
                            "header": {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "mode": "",
                                "allow_foreign_changes": "",
                                "sites": [],
                                "comment": ""
                            }
                        },
                        "response": {
                            "nodeId": null,
                            "name": "response",
                            "success": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result": ""
                                }
                            },
                            "fail": {
                                "nodeId": null,
                                "status": "200",
                                "header": {
                                    "Content-Type": "application/json"
                                },
                                "body": {
                                    "result_code": "1"
                                }
                            }
                        }
                    }
                ]
            },
            "methods": [
                {
                    "nodeId": 1210,
                    "index": "0_0_0_0_0",
                    "name": "get_host",
                    "color": "#98BEC7",
                    "request": {
                        "nodeId": 1206,
                        "endpoint": "{url}?_username={_username}&_secret={_secret}&action=get_host",
                        "method": "POST",
                        "header": null,
                        "body": {
                            "hostname": "#C77E7E.(response).success.result[]"
                        }
                    },
                    "response": {
                        "nodeId": 1819,
                        "name": "response",
                        "success": {
                            "nodeId": 1231,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result": {
                                    "hostname": ""
                                }
                            }
                        },
                        "fail": {
                            "nodeId": 1237,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result_code": "1"
                            }
                        }
                    }
                },
                {
                    "nodeId": 1209,
                    "index": "0_0_0_0_2_0",
                    "name": "edit_host",
                    "color": "#9EC798",
                    "request": {
                        "nodeId": 1203,
                        "endpoint": "{url}?_username={_username}&_secret={_secret}&action=edit_host",
                        "method": "POST",
                        "header": null,
                        "body": {
                            "hostname": "#C77E7E.(response).success.result[]",
                            "folder": "oc/example",
                            "attributes": {
                                "ipaddress": "#C77E7E.(response).success.result[]",
                                "site": "checkmk"
                            }
                        }
                    },
                    "response": {
                        "nodeId": 1818,
                        "name": "response",
                        "success": {
                            "nodeId": 1230,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result": ""
                            }
                        },
                        "fail": {
                            "nodeId": 1234,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result_code": "1"
                            }
                        }
                    }
                },
                {
                    "nodeId": 1213,
                    "index": "0_0_0_0_1_0",
                    "name": "add_host",
                    "color": "#6477AB",
                    "request": {
                        "nodeId": 1207,
                        "endpoint": "{url}?_username={_username}&_secret={_secret}&action=add_host",
                        "method": "POST",
                        "header": null,
                        "body": {
                            "hostname": "#C77E7E.(response).success.result[]",
                            "folder": "oc/example",
                            "attributes": {
                                "ipaddress": "#C77E7E.(response).success.result[]",
                                "site": "checkmk"
                            }
                        }
                    },
                    "response": {
                        "nodeId": 1817,
                        "name": "response",
                        "success": {
                            "nodeId": 1229,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result": ""
                            }
                        },
                        "fail": {
                            "nodeId": 1232,
                            "status": "200",
                            "header": null,
                            "body": {
                                "result_code": "1"
                            }
                        }
                    }
                }
            ],
            "operators": [
                {
                    "nodeId": 1822,
                    "type": "loop",
                    "index": "0",
                    "condition": {
                        "relationalOperator": null,
                        "leftStatement": {
                            "color": "#FFCFB5",
                            "field": "success.result[]",
                            "type": "response",
                            "rightPropertyValue": ""
                        },
                        "rightStatement": null
                    }
                },
                {
                    "nodeId": 405,
                    "type": "if",
                    "index": "0_0",
                    "condition": {
                        "relationalOperator": "NotEmpty",
                        "leftStatement": {
                            "color": "#C77E7E",
                            "field": "success.result[]",
                            "type": "response",
                            "rightPropertyValue": ""
                        },
                        "rightStatement": null
                    }
                },
                {
                    "nodeId": 411,
                    "type": "if",
                    "index": "0_0_0",
                    "condition": {
                        "relationalOperator": "NotNull",
                        "leftStatement": {
                            "color": "#C77E7E",
                            "field": "success.result[0].hostname",
                            "type": "response",
                            "rightPropertyValue": ""
                        },
                        "rightStatement": null
                    }
                },
                {
                    "nodeId": 414,
                    "type": "if",
                    "index": "0_0_0_0",
                    "condition": {
                        "relationalOperator": "NotNull",
                        "leftStatement": {
                            "color": "#C77E7E",
                            "field": "success.result[0].ipv4_address.ref_title",
                            "type": "response",
                            "rightPropertyValue": ""
                        },
                        "rightStatement": null
                    }
                },
                {
                    "nodeId": 404,
                    "type": "if",
                    "index": "0_0_0_0_1",
                    "condition": {
                        "relationalOperator": "=",
                        "leftStatement": {
                            "color": "#98BEC7",
                            "field": "success.result",
                            "type": "response",
                            "rightPropertyValue": ""
                        },
                        "rightStatement": {
                            "color": "",
                            "field": "Check_MK exception: No such host",
                            "type": "",
                            "rightPropertyValue": ""
                        }
                    }
                },
                {
                    "nodeId": 412,
                    "type": "if",
                    "index": "0_0_0_0_2",
                    "condition": {
                        "relationalOperator": "!=",
                        "leftStatement": {
                            "color": "#98BEC7",
                            "field": "success.result",
                            "type": "response",
                            "rightPropertyValue": ""
                        },
                        "rightStatement": {
                            "color": "",
                            "field": "Check_MK exception: No such host",
                            "type": "",
                            "rightPropertyValue": ""
                        }
                    }
                }
            ]
        },
        "fieldBinding": [
            {
                "from": [
                    {
                        "color": "#C77E7E",
                        "type": "response",
                        "field": "success.result[]"
                    }
                ],
                "enhancement": {
                    "enhanceId": 399,
                    "name": "",
                    "description": "",
                    "expertCode": "RESULT_VAR = VAR_0[0].hostname;",
                    "expertVar": "//var RESULT_VAR = #98BEC7.(request).hostname;\n//var VAR_0 = #C77E7E.(response).success.result[];",
                    "simpleCode": null,
                    "language": "js"
                },
                "to": [
                    {
                        "color": "#98BEC7",
                        "type": "request",
                        "field": "hostname"
                    }
                ]
            },
            {
                "from": [
                    {
                        "color": "#C77E7E",
                        "type": "response",
                        "field": "success.result[]"
                    }
                ],
                "enhancement": {
                    "enhanceId": 400,
                    "name": "",
                    "description": "",
                    "expertCode": "RESULT_VAR = VAR_0[0].hostname;",
                    "expertVar": "//var RESULT_VAR = #6477AB.(request).hostname;\n//var VAR_0 = #C77E7E.(response).success.result[];",
                    "simpleCode": null,
                    "language": "js"
                },
                "to": [
                    {
                        "color": "#6477AB",
                        "type": "request",
                        "field": "hostname"
                    }
                ]
            },
            {
                "from": [
                    {
                        "color": "#C77E7E",
                        "type": "response",
                        "field": "success.result[]"
                    }
                ],
                "enhancement": {
                    "enhanceId": 401,
                    "name": "",
                    "description": "",
                    "expertCode": "RESULT_VAR = VAR_0[0].ipv4_address.ref_title;\n",
                    "expertVar": "//var RESULT_VAR = #6477AB.(request).attributes.ipaddress;\n//var VAR_0 = #C77E7E.(response).success.result[];",
                    "simpleCode": null,
                    "language": "js"
                },
                "to": [
                    {
                        "color": "#6477AB",
                        "type": "request",
                        "field": "attributes.ipaddress"
                    }
                ]
            },
            {
                "from": [
                    {
                        "color": "#C77E7E",
                        "type": "response",
                        "field": "success.result[]"
                    }
                ],
                "enhancement": {
                    "enhanceId": 402,
                    "name": "",
                    "description": "",
                    "expertCode": "RESULT_VAR = VAR_0[0].hostname;",
                    "expertVar": "//var RESULT_VAR = #9EC798.(request).hostname;\n//var VAR_0 = #C77E7E.(response).success.result[];",
                    "simpleCode": null,
                    "language": "js"
                },
                "to": [
                    {
                        "color": "#9EC798",
                        "type": "request",
                        "field": "hostname"
                    }
                ]
            },
            {
                "from": [
                    {
                        "color": "#C77E7E",
                        "type": "response",
                        "field": "success.result[]"
                    }
                ],
                "enhancement": {
                    "enhanceId": 403,
                    "name": "",
                    "description": "",
                    "expertCode": "RESULT_VAR = VAR_0[0].ipv4_address.ref_title;",
                    "expertVar": "//var RESULT_VAR = #9EC798.(request).attributes.ipaddress;\n//var VAR_0 = #C77E7E.(response).success.result[];",
                    "simpleCode": null,
                    "language": "js"
                },
                "to": [
                    {
                        "color": "#9EC798",
                        "type": "request",
                        "field": "attributes.ipaddress"
                    }
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
        "message" : "CREATION_ERROR",
        "success" : "false",
        "path" : "/api/connection/all"
    }

If you look up to the neo4j database you will find visual representation of created data.

.. image:: img/graph.png
    :align: center


Get all Connections
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

    [
        {
            "connectionId": 101,
            "title": "js test",
            "description": "",
            "links": []
        },
        {
            "connectionId": 103,
            "title": "idoit.checkMK.create",
            "description": "",
            "links": []
        },
        {
            "connectionId": 112,
            "title": "idoit2CheckMK",
            "description": "",
            "links": []
        },
        {
            "connectionId": 113,
            "title": "test",
            "description": "",
            "links": []
        }
    ]

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
        "connectionId": 41,
        "title": "Best transaction",
        "description": "Description",
        "fromConnector": {
            // connector object
        },
        "toConnector": {
            // connector object
        },
        "fieldBinding": [
            "from": [
                {
                    "color": "#C77E7E",
                    "type": "response",
                    "field": "success.result[]"
                }
            ],
            "enhancement": {
                "enhanceId": 399,
                "name": "",
                "description": "",
                "expertCode": "RESULT_VAR = VAR_0[0].hostname;",
                "expertVar": "//var RESULT_VAR = #98BEC7.(request).hostname;\n//var VAR_0 = #C77E7E.(response).success.result[];",
                "simpleCode": null,
                "language": "js"
            },
            "to": [
                {
                    "color": "#98BEC7",
                    "type": "request",
                    "field": "hostname"
                }
            ]
        ]
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
        "error" : "Bad credentials",
        "message" : "ACCESS_DENIED",
        "path" : "/api/connection/all"
    }

    {
        "timestamp": "2020-07-07T10:55:46.279+0000",
        "status": 500,
        "error": "Internal Server Error",
        "message": "No message available",
        "path": "/api/connection/116"
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

Check if Connection name already exists in DB.
=================

When Connection deleted it also delete all his children

.. parsed-literal::
    # Http request
    ``GET`` http://localhost:8080/api/connection/check/{name} HTTP/1.1

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

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 200,
        "error" : "OK",
        "message" : "EXISTS",
        "path" : "/api/connection"
    }

**Error:**

.. code-block:: json
    :caption: ``Body:``

    {
        "timestamp" : "2018-05-24T12:44:26.295+0000",
        "status" : 200,
        "error" : "OK",
        "message" : "NOT_EXISTS",
        "path" : "/api/connection"
    }

