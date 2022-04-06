/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

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
            /*if(isArray(config) && config.length > 0) {
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
            }*/
            executionResult.invokerData = invoker.getXml();
        }else{
            executionResult.error.message = `One of the version is not defined: from - ${fromVersion}, to - ${toVersion}`;
        }
        return executionResult;
    }
}