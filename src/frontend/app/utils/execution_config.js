import {isString} from "@utils/app";

const V10V11 = [];
const V11V12 = [];
const V12V13 = [
    {"selectedParam":{"name":"body","path":["fromConnector","methods","0","request"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":1},
    {"selectedParam":{"name":"body","path":["fromConnector","methods","0","response", "success"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":2},
    {"selectedParam":{"name":"body","path":["fromConnector","methods","0","response", "fail"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":3},
    {"selectedParam":{"name":"body","path":["toConnector","methods","0","request"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":4},
    {"selectedParam":{"name":"body","path":["toConnector","methods","0","response", "success"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":5},
    {"selectedParam":{"name":"body","path":["toConnector","methods","0","response", "fail"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":6},
    {"selectedParam":{"name":"operators","path":["toConnector"]},"type":"SET_ITERATORS","setData":{"value":"","name":"","path":[]},"id":7},
    {"selectedParam":{"name":"operators","path":["fromConnector"]},"type":"SET_ITERATORS","setData":{"value":"","name":"","path":[]},"id":8}
];
const V13V12 = [
    {"selectedParam":{"name":"fields","path":["fromConnector","methods","0","request","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["fromConnector","methods","0","request"]},"id":1},
    {"selectedParam":{"name":"fields","path":["fromConnector","methods","0","response","success","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["fromConnector","methods","0","reponse", "success"]},"id":2},
    {"selectedParam":{"name":"fields","path":["fromConnector","methods","0","response","fail","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["fromConnector","methods","0","response","fail"]},"id":3},
    {"selectedParam":{"name":"fields","path":["toConnector","methods","0","request","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["toConnector","methods","0","request"]},"id":4},
    {"selectedParam":{"name":"fields","path":["toConnector","methods","0","response","success","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["toConnector","methods","0","response","success"]},"id":5},
    {"selectedParam":{"name":"fields","path":["toConnector","methods","0","response","fail","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["toConnector","methods","0","response","fail"]},"id":6},
    [{"selectedParam":{"name":"iterator","path":["fromConnector","operators","0"]},"type":"REMOVE_PARAM","setData":{"value":"","name":"","path":[]},"id":7}],
    [{"selectedParam":{"name":"iterator","path":["toConnector","operators","0"]},"type":"REMOVE_PARAM","setData":{"value":"","name":"","path":[]},"id":7}]
];
const V12V11 = [];
const V11V10 = [];

const CONFIGS = {
    'V1.0V1.1': V10V11,
    'V1.1V1.2': V11V12,
    'V1.2V1.3': V12V13,
    'V1.3V1.2': V13V12,
    'V1.2V1.1': V12V11,
    'V1.1V1.0': V11V10,
};

export function getConfig(fromVersion, toVersion){
    let result = [];
    if(!fromVersion){
        return CONFIGS['V1.2V1.3'];
    }
    if(isString(fromVersion) && isString(toVersion)) {
        let versionParam = `V${fromVersion}V${toVersion}`;
        if(CONFIGS.hasOwnProperty(versionParam)){
            result = CONFIGS[versionParam];
        }
    }
    return result;
}