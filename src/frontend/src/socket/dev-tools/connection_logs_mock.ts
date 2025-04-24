import {ConnectionSocketLog} from "@root/requests/models/ConnectionLog";

export const MockLogs: ConnectionSocketLog[] = [
    {
        "executionId": "26",
        "connectionId": "13",
        "connectorId": "1",
        "connectorName": "i-doit",
        "logType": "method",
        "httpMethod": "GET",
        "executionTime": 42,
        "indexPath": "0",
        "url": "https://i-doit.api.de",
        "statusCode": 200,
        "requestDetails": {
            "headers": {
                "Authorization": "{token}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "body": {
                "role": "#C77E7E.(response).body.$.data",
                "name": "",
                "id": "",
                "units": [],
                "department": ""
            }
        },
        "responseDetails": {
            "headers": {
                "Authorization": "{token}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "body": {
                "role": "#C77E7E.(response).body.$.data",
                "name": "",
                "id": "",
                "units": [],
                "department": ""
            }
        }
    },
    {
        "executionId": "26",
        "connectionId": "13",
        "connectorId": "1",
        "connectorName": "i-doit",
        "logType": "operator",
        "indexPath": "1",
        "conditionStatement": "for {%#FFCFB5.(response).body.$.[*]%",
        "info": {
            "type": "loop",
            "iteration": {
                "current": 1,
                "total": 50
            }
        },
        "traces": [
            {
                "logType": "operator",
                "indexPath": "1_0",
                "conditionStatement": "({%#C77E7E.(response).body.$.data%} IsEmpty)",
                "info": {
                    "type": "if",
                    "conditionResult": true
                },
                "traces": []
            },
            {
                "logType": "method",
                "httpMethod": "POST",
                "executionTime": 42,
                "indexPath": "1_1",
                "url": "https://i-doit.api.de/post-method",
                "statusCode": 200,
                "requestDetails": {
                    "headers": {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    "body": {
                        "role": "#C77E7E.(response).body.$.data",
                        "name": "",
                        "id": "",
                        "units": [],
                        "department": ""
                    }
                },
                "responseDetails": {
                    "headers": {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    "body": {
                        "networkName": "",
                        "unitID": ""
                    }
                }
            }
        ]
    },
    {
        "executionId": "26",
        "connectionId": "13",
        "connectorId": "2",
        "connectorName": "otrs",
        "logType": "method",
        "httpMethod": "POST",
        "executionTime": 42,
        "indexPath": "0",
        "url": "https://otrs.api.de",
        "statusCode": 200,
        "requestDetails": {
            "headers": {
                "Authorization": "{token}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "body": {
                "role": "#C77E7E.(response).body.$.data",
                "name": "",
                "id": "",
                "units": [],
                "department": ""
            }
        },
        "responseDetails": {
            "headers": {
                "Authorization": "{token}",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "body": {
                "role": "#C77E7E.(response).body.$.data",
                "name": "",
                "id": "",
                "units": [],
                "department": ""
            }
        }
    },
    {
        "executionId": "26",
        "connectionId": "13",
        "connectorId": "2",
        "connectorName": "otrs",
        "logType": "operator",
        "indexPath": "1",
        "conditionStatement": "for {%#FFCFB5.(response).body.$.[*]%",
        "info": {
            "type": "loop",
            "iteration": {
                "current": 1,
                "total": 50
            }
        },
        "traces": [
            {
                "logType": "operator",
                "indexPath": "1_0",
                "conditionStatement": "({%#C77E7E.(response).body.$.data%} IsEmpty)",
                "info": {
                    "type": "if",
                    "conditionResult": true
                },
                "traces": [
                    {
                        "logType": "operator",
                        "indexPath": "1_0_0",
                        "conditionStatement": "({%#C77E7E.(response).body.$.data%} IsEmpty)",
                        "info": {
                            "type": "if",
                            "conditionResult": true
                        },
                        "traces": [
                            {
                                "logType": "operator",
                                "indexPath": "1_0_0_0",
                                "conditionStatement": "({%#C77E7E.(response).body.$.data%} IsEmpty)",
                                "info": {
                                    "type": "if",
                                    "conditionResult": true
                                },
                                "traces": []
                            }
                        ]
                    },
                    {
                        "logType": "method",
                        "httpMethod": "PUT",
                        "executionTime": 42,
                        "indexPath": "1_0_0_1",
                        "url": "https://otrs.api.de/put-method",
                        "statusCode": 200,
                        "requestDetails": {
                            "headers": {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "role": "#C77E7E.(response).body.$.data",
                                "name": "",
                                "id": "",
                                "units": [],
                                "department": ""
                            }
                        },
                        "responseDetails": {
                            "headers": {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "networkName": "",
                                "unitID": ""
                            }
                        }
                    },
                    {
                        "logType": "method",
                        "httpMethod": "DELETE",
                        "executionTime": 42,
                        "indexPath": "1_0_0_2",
                        "url": "https://otrs.api.de/delete-method",
                        "statusCode": 200,
                        "requestDetails": {
                            "headers": {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "role": "#C77E7E.(response).body.$.data",
                                "name": "",
                                "id": "",
                                "units": [],
                                "department": ""
                            }
                        },
                        "responseDetails": {
                            "headers": {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            "body": {
                                "networkName": "",
                                "unitID": ""
                            }
                        }
                    }
                ]
            },
            {
                "logType": "method",
                "httpMethod": "POST",
                "executionTime": 42,
                "indexPath": "1_1",
                "url": "https://otrs.api.de/post-method",
                "statusCode": 200,
                "requestDetails": {
                    "headers": {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    "body": {
                        "role": "#C77E7E.(response).body.$.data",
                        "name": "",
                        "id": "",
                        "units": [],
                        "department": ""
                    }
                },
                "responseDetails": {
                    "headers": {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    "body": {
                        "networkName": "",
                        "unitID": ""
                    }
                }
            }
        ]
    },
];
