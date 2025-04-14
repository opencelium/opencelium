import React from 'react';
import OperatorBuilder from "@app_component/operator_builder/OperatorBuilder";
import {OperatorType} from "@app_component/operator_builder/props";
interface ConnectionLog {
    executionId: string,
    connectionId: string,
    connectors: ConnectorLog[],
}
interface ConnectorLog {
    id: string,
    name: string,
    traces: Trace[]
}
type Trace = MethodTrace | OperatorTrace;
interface MethodTrace {
    logType: "method",
    indexPath: string,
    httpMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    statusCode: number,
    url: string,
    executionTime: number,
    requestDetails?: HttpRequestLog,
    responseDetails?: HttpResponseLog,
}
interface HttpRequestLog {
    headers: Record<string, string>;
    body?: any; // you could make this more specific if needed
}

interface HttpResponseLog {
    headers: Record<string, string>;
    body?: any;
}
interface OperatorTrace {
    logType: "operator",
    indexPath: string,
    conditionStatement: string,
    info: OperatorInfo,
    traces: Trace[],
}
type OperatorInfo = OperatorLoopInfo | OperatorIfInfo
interface OperatorLoopInfo {
    type: "loop",
    iteration: {
        current: number,
        total: number,
    }
}
interface OperatorIfInfo {
    type: "if",
    conditionResult: boolean,
}

const Logs: ConnectionLog = {
    connectionId: '13',
    executionId: '26',
    connectors: [
        {
            id: '1',
            name: 'i-doit',
            traces: [{
                logType: 'method',
                httpMethod: 'GET',
                executionTime: 42,
                indexPath: '0',
                url: 'https://i-doit.api.de',
                statusCode: 200,
                requestDetails: {
                    headers: {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: {
                        "role": "#C77E7E.(response).body.$.data",
                        "name": "",
                        "id": "",
                        "units": [],
                        "department": "",
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencoded",
                        "networkName": "",
                        "unitID": "",
                        "role1": "#C77E7E.(response).body.$.data",
                        "name2": "",
                        "id3": "",
                        "units4": [],
                        "department5": "",
                        "Authorization6": "{token}",
                        "Content-Type7": "application/x-www-form-urlencoded",
                        "networkName8": "",
                        "unitID9": ""
                    }
                },
                responseDetails: {
                    headers: {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: {
                        "role": "#C77E7E.(response).body.$.data",
                        "name": "",
                        "id": "",
                        "units": [],
                        "department": ""
                    }
                }
            }, {
                logType: 'operator',
                indexPath: '1',
                conditionStatement: 'for {%#FFCFB5.(response).body.$.[*]%}',
                info: {
                    type: 'loop',
                    iteration: {
                        current: 1,
                        total: 50
                    }
                },
                traces: [
                    {
                        logType: 'operator',
                        indexPath: '1_0',
                        conditionStatement: '({%#C77E7E.(response).body.$.data%} IsEmpty)',
                        info: {
                            type: 'if',
                            conditionResult: true,
                        },
                        traces: [

                        ]
                    },{
                        logType: 'method',
                        httpMethod: 'POST',
                        executionTime: 42,
                        indexPath: '1_1',
                        url: 'https://i-doit.api.de/post-method',
                        statusCode: 200,
                        requestDetails: {
                            headers: {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            body: {
                                "role": "#C77E7E.(response).body.$.data",
                                "name": "",
                                "id": "",
                                "units": [],
                                "department": ""
                            }
                        },
                        responseDetails: {
                            headers: {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            body: {
                                "networkName": "",
                                "unitID": ""
                            }
                        }
                    }
                ]
            }]
        }, {
            id: '2',
            name: 'otrs',
            traces: [{
                logType: 'method',
                httpMethod: 'POST',
                executionTime: 42,
                indexPath: '0',
                url: 'https://otrs.api.de',
                statusCode: 200,
                requestDetails: {
                    headers: {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: {
                        "role": "#C77E7E.(response).body.$.data",
                        "name": "",
                        "id": "",
                        "units": [],
                        "department": "",
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencodedapplication/x-www-form-urlencoded",
                        "networkName": "",
                        "unitID": "",
                        "role1": "#C77E7E.(response).body.$.data",
                        "name2": "",
                        "id3": "",
                        "units4": [],
                        "department5": "",
                        "Authorization6": "{token}",
                        "Content-Type7": "application/x-www-form-urlencoded",
                        "networkName8": "",
                        "unitID9": ""
                    }
                },
                responseDetails: {
                    headers: {
                        "Authorization": "{token}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: {
                        "role": "#C77E7E.(response).body.$.data",
                        "name": "",
                        "id": "",
                        "units": [],
                        "department": ""
                    }
                }
            }, {
                logType: 'operator',
                indexPath: '1',
                conditionStatement: 'for {%#FFCFB5.(response).body.$.[*]%}',
                info: {
                    type: 'loop',
                    iteration: {
                        current: 1,
                        total: 50
                    }
                },
                traces: [
                    {
                        logType: 'operator',
                        indexPath: '1_0',
                        conditionStatement: '({%#C77E7E.(response).body.$.data%} IsEmpty)',
                        info: {
                            type: 'if',
                            conditionResult: true,
                        },
                        traces: [
                            {
                                logType: 'operator',
                                indexPath: '1_0_0',
                                conditionStatement: '({%#C77E7E.(response).body.$.data%} IsEmpty)',
                                info: {
                                    type: 'if',
                                    conditionResult: true,
                                },
                                traces: [
                                    {
                                        logType: 'operator',
                                        indexPath: '1_0_0_0',
                                        conditionStatement: '({%#C77E7E.(response).body.$.data%} IsEmpty)',
                                        info: {
                                            type: 'if',
                                            conditionResult: true,
                                        },
                                        traces: [

                                        ]
                                    }
                                ]
                            },{
                                logType: 'method',
                                httpMethod: 'PUT',
                                executionTime: 42,
                                indexPath: '1_0_0_1',
                                url: 'https://otrs.api.de/put-method',
                                statusCode: 200,
                                requestDetails: {
                                    headers: {
                                        "Authorization": "{token}",
                                        "Content-Type": "application/x-www-form-urlencoded"
                                    },
                                    body: {
                                        "role": "#C77E7E.(response).body.$.data",
                                        "name": "",
                                        "id": "",
                                        "units": [],
                                        "department": ""
                                    }
                                },
                                responseDetails: {
                                    headers: {
                                        "Authorization": "{token}",
                                        "Content-Type": "application/x-www-form-urlencoded"
                                    },
                                    body: {
                                        "networkName": "",
                                        "unitID": ""
                                    }
                                }
                            },{
                                logType: 'method',
                                httpMethod: 'DELETE',
                                executionTime: 42,
                                indexPath: '1_0_0_2',
                                url: 'https://otrs.api.de/delete-method',
                                statusCode: 200,
                                requestDetails: {
                                    headers: {
                                        "Authorization": "{token}",
                                        "Content-Type": "application/x-www-form-urlencoded"
                                    },
                                    body: {
                                        "role": "#C77E7E.(response).body.$.data",
                                        "name": "",
                                        "id": "",
                                        "units": [],
                                        "department": ""
                                    }
                                },
                                responseDetails: {
                                    headers: {
                                        "Authorization": "{token}",
                                        "Content-Type": "application/x-www-form-urlencoded"
                                    },
                                    body: {
                                        "networkName": "",
                                        "unitID": ""
                                    }
                                }
                            }
                        ]
                    },{
                        logType: 'method',
                        httpMethod: 'POST',
                        executionTime: 42,
                        indexPath: '1_1',
                        url: 'https://otrs.api.de/post-method',
                        statusCode: 200,
                        requestDetails: {
                            headers: {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            body: {
                                "role": "#C77E7E.(response).body.$.data",
                                "name": "",
                                "id": "",
                                "units": [],
                                "department": ""
                            }
                        },
                        responseDetails: {
                            headers: {
                                "Authorization": "{token}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            body: {
                                "networkName": "",
                                "unitID": ""
                            }
                        }
                    }
                ]
            }]
        }
    ]
}
const Sandbox = () => {
    return (
        <OperatorBuilder connection={null} connector={null} item={null} updateConnection={null} type={OperatorType.If}/>
    )
}

export default Sandbox;
