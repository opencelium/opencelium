import React from 'react';

import {isArray, } from "@utils/app";
import {getConfig} from "@utils/execution_config";
import CInvoker from "@classes/components/content/invoker/CInvoker";

export const RULE_TYPES = {
    SET_BODY_FORMAT: 'SET_BODY_FORMAT',
};

export default class CExecution{

    static executeConfig({fromVersion = '', toVersion = ''}, invokerData){
        let executionResult = {invokerData: '', error: {message: ''}};
        const config = getConfig(fromVersion, toVersion, 'invoker');
        const invoker = CInvoker.createInvoker(invokerData);
        if(!(fromVersion === '' || toVersion === '')){
            if(isArray(config) && config.length > 0) {
                for (let i = 0; i < config.length; i++) {
                    switch (config[i].type) {
                        case RULE_TYPES.RENAME_PARAM:
                            executionResult.invokerData = invoker.getXml();
                            break;
                        default:
                            executionResult.error.message = 'Such rule for converting does not exist';
                            break;
                    }
                }
            }
        }else{
            executionResult.error.message = `One of the version is not defined: from - ${fromVersion}, to - ${toVersion}`;
        }
        return executionResult;
    }
}