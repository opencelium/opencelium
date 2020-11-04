import {isString} from "@utils/app";

const V1V2 = [];
const V2V3 = [];
const V3V4 = [
    {"selectedParam":{"name":"body","path":["connection","fromConnector","methods","0","request"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":1},
    {"selectedParam":{"name":"body","path":["connection","fromConnector","methods","0","response", "success"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":2},
    {"selectedParam":{"name":"body","path":["connection","fromConnector","methods","0","response", "fail"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":3},
    {"selectedParam":{"name":"body","path":["connection","toConnector","methods","0","request"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":4},
    {"selectedParam":{"name":"body","path":["connection","toConnector","methods","0","response", "success"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":5},
    {"selectedParam":{"name":"body","path":["connection","toConnector","methods","0","response", "fail"]},"type":"REPLACE_VALUE","setData":{"value":{"data":"raw","format":"json","type":"array","fields":"$SELECTED_PARAM$"},"name":""},"id":6}
];
const V4V3 = [
    {"selectedParam":{"name":"fields","path":["connection","fromConnector","methods","0","request","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["connection","fromConnector","methods","0","request"]},"id":1},
    {"selectedParam":{"name":"fields","path":["connection","fromConnector","methods","0","response","success","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["connection","fromConnector","methods","0","reponse", "success"]},"id":2},
    {"selectedParam":{"name":"fields","path":["connection","fromConnector","methods","0","response","fail","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["connection","fromConnector","methods","0","response","fail"]},"id":3},
    {"selectedParam":{"name":"fields","path":["connection","toConnector","methods","0","request","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["connection","toConnector","methods","0","request"]},"id":4},
    {"selectedParam":{"name":"fields","path":["connection","toConnector","methods","0","response","success","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["connection","toConnector","methods","0","response","success"]},"id":5},
    {"selectedParam":{"name":"fields","path":["connection","toConnector","methods","0","response","fail","body"]},"type":"MOVE_PARAM","setData":{"value":"","name":"body","path":["connection","toConnector","methods","0","response","fail"]},"id":6}
];
const V3V2 = [];
const V2V1 = [];

const CONFIGS = {
    V1V2,
    V2V3,
    V3V4,
    V4V3,
    V3V2,
    V2V1,
};

export function getConfig(fromVersion, toVersion){
    let result = [];
    if(isString(fromVersion) && isString(toVersion)) {
        let versionParam = `V${parseInt(fromVersion)}V${parseInt(toVersion)}`;
        if(CONFIGS.hasOwnProperty(versionParam)){
            result = CONFIGS[versionParam];
        }
    }
    return result;
}