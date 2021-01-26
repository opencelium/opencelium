import {isString} from "@utils/app";

const T_V10V11 = [];
const T_V11V12 = [];
const T_V12V13 = [
    {"selectedParam":{"name":"body","path":["fromConnector","methods","0","request"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"object","fields":"$SELECTED_PARAM$"},"name":""},"id":1},
    {"selectedParam":{"name":"body","path":["fromConnector","methods","0","response", "success"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"object","fields":"$SELECTED_PARAM$"},"name":""},"id":2},
    {"selectedParam":{"name":"body","path":["fromConnector","methods","0","response", "fail"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"object","fields":"$SELECTED_PARAM$"},"name":""},"id":3},
    {"selectedParam":{"name":"body","path":["toConnector","methods","0","request"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"object","fields":"$SELECTED_PARAM$"},"name":""},"id":4},
    {"selectedParam":{"name":"body","path":["toConnector","methods","0","response", "success"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"object","fields":"$SELECTED_PARAM$"},"name":""},"id":5},
    {"selectedParam":{"name":"body","path":["toConnector","methods","0","response", "fail"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"object","fields":"$SELECTED_PARAM$"},"name":""},"id":6},
    {"selectedParam":{"name":"operators","path":["toConnector"]},"type":"SET_ITERATORS","setData":{"value":"","name":"","path":[]},"id":7},
    {
        "selectedParam":{"name":"operators","path":["fromConnector"]},
        "type":"SET_ITERATORS",
        "setData":{"value":"","name":"","path":[]},
        "id":8
    },
    {
        "selectedParam":{"name":"","path":[]},
        "type":"SET_ITERATORS_IN_BRACKETS",
        "setData":{"value":"","name":"","path":[]},
        "id":9
    }
];
const T_V13V12 = [
    {"selectedParam":{"name":"fields","path":["fromConnector","methods","0","request","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["fromConnector","methods","0","request"]},"id":1},
    {"selectedParam":{"name":"fields","path":["fromConnector","methods","0","response","success","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["fromConnector","methods","0","reponse", "success"]},"id":2},
    {"selectedParam":{"name":"fields","path":["fromConnector","methods","0","response","fail","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["fromConnector","methods","0","response","fail"]},"id":3},
    {"selectedParam":{"name":"fields","path":["toConnector","methods","0","request","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["toConnector","methods","0","request"]},"id":4},
    {"selectedParam":{"name":"fields","path":["toConnector","methods","0","response","success","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["toConnector","methods","0","response","success"]},"id":5},
    {"selectedParam":{"name":"fields","path":["toConnector","methods","0","response","fail","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["toConnector","methods","0","response","fail"]},"id":6},
    [{"selectedParam":{"name":"iterator","path":["fromConnector","operators","0"]},"type":"REMOVE_PARAM","setData":{"value":"","name":"","path":[]},"id":7}],
    [{"selectedParam":{"name":"iterator","path":["toConnector","operators","0"]},"type":"REMOVE_PARAM","setData":{"value":"","name":"","path":[]},"id":7}]
];
const T_V12V11 = [];
const T_V11V10 = [];

const I_V12V13 = ["SET_BODY_FORMAT"];
const I_V13V14 = ["SET_BODY_FORMAT"];

const TEMPLATE_CONFIGS = {
    'V1.0V1.1': T_V10V11,
    'V1.1V1.2': T_V11V12,
    'V1.2V1.3': T_V12V13,
    'V1.3V1.2': T_V13V12,
    'V1.2V1.1': T_V12V11,
    'V1.1V1.0': T_V11V10,
};
const INVOKER_CONFIGS = {
    'V1.2V1.3': I_V12V13,
    'V1.3V1.4': I_V13V14,
};

export function getConfig(fromVersion, toVersion, component){
    let result = [];
    if(!fromVersion){
        return result;
    }
    if(isString(fromVersion) && isString(toVersion)) {
        let versionParam = `V${fromVersion}V${toVersion}`;
        switch (component){
            case 'template':
                if(TEMPLATE_CONFIGS.hasOwnProperty(versionParam)){
                    result = TEMPLATE_CONFIGS[versionParam];
                }
                break;
            case 'invoker':
                if(INVOKER_CONFIGS.hasOwnProperty(versionParam)){
                    result = INVOKER_CONFIGS[versionParam];
                }
                break;
        }
    }
    return result;
}