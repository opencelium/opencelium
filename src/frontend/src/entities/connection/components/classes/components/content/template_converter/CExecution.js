/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

import {isArray, isNumber} from "@application/utils/utils";
import {getConfig} from "@entity/connection/components/utils/execution_config";
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {LOOP_OPERATOR} from "@entity/connection/components/classes/components/content/connection/operator/COperatorItem";

const SELECTED_PARAM = "$SELECTED_PARAM$";

export const RULE_TYPES = {
    REPLACE_VALUE: 'REPLACE_VALUE',
    RENAME_PARAM: 'RENAME_PARAM',
    REMOVE_PARAM: 'REMOVE_PARAM',
    ADD_PARAM: 'ADD_PARAM',
    MOVE_PARAM: 'MOVE_PARAM',
    SET_ITERATORS: 'SET_ITERATORS',
    SET_RESULT_ARRAY_FOR_IDOIT_SYSTEM: 'SET_RESULT_ARRAY_FOR_IDOIT_SYSTEM',
    CORRECT_BODY: 'CORRECT_BODY',
    SET_ITERATORS_IN_BRACKETS: 'SET_ITERATORS_IN_BRACKETS',
};

export default class CExecution{

    static executeConfig({fromVersion = '', toVersion = ''}, jsonData){
        let executionResult = {jsonData, error: {message: ''}};
        const config = getConfig(fromVersion, toVersion, 'template');
        if(isArray(config) && config.length > 0) {
            for (let i = 0; i < config.length; i++) {
                switch (config[i].type) {
                    case RULE_TYPES.RENAME_PARAM:
                        executionResult = CExecution.renameParam(config[i], executionResult.jsonData);
                        break;
                    case RULE_TYPES.REMOVE_PARAM:
                        executionResult = CExecution.removeParam(config[i], executionResult.jsonData);
                        break;
                    case RULE_TYPES.ADD_PARAM:
                        executionResult = CExecution.addParamAfterSelected(config[i], executionResult.jsonData);
                        break;
                    case RULE_TYPES.REPLACE_VALUE:
                        executionResult = CExecution.replaceValue(config[i], executionResult.jsonData);
                        break;
                    case RULE_TYPES.MOVE_PARAM:
                        executionResult = CExecution.moveParam(config[i], executionResult.jsonData);
                        break;
                    case RULE_TYPES.SET_ITERATORS:
                        executionResult = CExecution.setIteratorsForLoopOperators(config[i], executionResult.jsonData);
                        break;
                    case RULE_TYPES.SET_RESULT_ARRAY_FOR_IDOIT_SYSTEM:
                        executionResult = CExecution.setResultArrayForIdoitSystem(config[i], executionResult.jsonData);
                        break;
                    case RULE_TYPES.SET_ITERATORS_IN_BRACKETS:
                        executionResult = CExecution.setIteratorsInBrackets(config[i], executionResult.jsonData);
                        break;
                }
                if(executionResult.error.message !== ''){
                    break;
                }
            }
        }
        return {jsonData: {...executionResult.jsonData}, error: executionResult.error};
    }

    static checkOnExistence(param, name, error = {}){
        if(!param || !param.hasOwnProperty(name)){
            error.messageData = {name};
            error.message = 'PROPERTY_NOT_EXIST';
            error.data = {...param};
            return false;
        }
        return true;
    }

    static getValue(jsonData, error, rule, index = -1){
        let value = {...jsonData};
        if(rule.setData.path && rule.setData.path.length > 0 && rule.selectedParam && rule.selectedParam.path && rule.selectedParam.path.length > 0) {
            let pathElementWithIndex = -1;
            let path = [...rule.selectedParam.path];
            path.push(rule.selectedParam.name);
            for (let i = path.length - 1; i >= 0; i--) {
                if (isNumber(path[i])) {
                    pathElementWithIndex = i;
                    break;
                }
            }
            for (let i = 0; i < path.length; i++) {
                let prop = path[i];
                if(i === pathElementWithIndex && index !== -1){
                    prop = index;
                }
                if (CExecution.checkOnExistence(value, prop, error)) {
                    value = value[prop];
                } else {
                    return value;
                }
            }
        } else{
            value = rule.setData.value;
        }
        return value;
    }

    static executeRule(rule, json, path, setValue){
        let jsonData = {...json};
        let error = {message: '', data: null, messageData: {}};
        let newParamValue = CExecution.getValue(json, error, rule);
        if (error.message !== '') {
            return {jsonData, error};
        }
        if(path.length === 0 || path.length === 1 && path[0] === ''){
            setValue({json: jsonData, newParamValue, error});
            if(error.message !== ''){
                return {jsonData, error};
            }
        } else{
            let pieceOfJson = jsonData;
            let arrayPath = [];
            for(let i = 0; i < path.length; i++){
                if(isNumber(path[i])) {
                    arrayPath = path.slice(i);
                }
                if(CExecution.checkOnExistence(pieceOfJson, path[i], error)) {
                    pieceOfJson = pieceOfJson[path[i]];
                } else{
                    break;
                }
            }
            setValue({json: pieceOfJson, newParamValue, error});
            if(error.message !== ''){
                return {jsonData: pieceOfJson, error};
            }
            if(arrayPath.length > 0){
                pieceOfJson = jsonData;
                for(let i = 0; i < path.length - arrayPath.length; i++){
                    if(CExecution.checkOnExistence(pieceOfJson, path[i], error)) {
                        pieceOfJson = pieceOfJson[path[i]];
                    } else{
                        break;
                    }
                }
                let arrayPieceOfJson = pieceOfJson;
                for(let i = 0; i < pieceOfJson.length; i++){
                    if(parseInt(arrayPath[0]) !== i) {
                        arrayPieceOfJson = pieceOfJson[i];
                        for (let j = 1; j < arrayPath.length; j++) {
                            if(CExecution.checkOnExistence(arrayPieceOfJson, arrayPath[j], error)) {
                                arrayPieceOfJson = arrayPieceOfJson[arrayPath[j]];
                            } else{
                                break;
                            }
                        }
                        newParamValue = CExecution.getValue(json, error, rule, i);
                        if (error.message !== '') {
                            return {jsonData: arrayPieceOfJson, error};
                        }
                        setValue({json: arrayPieceOfJson, newParamValue, error});
                        if (error.message !== '') {
                            return {jsonData: arrayPieceOfJson, error};
                        }
                    }
                }
            }
        }
        return {jsonData, error};
    }

    static replaceValue(rule, jsonData){
        const oldParamName = rule.selectedParam.name;
        const path = rule.selectedParam.path;
        function setValue(value){
            let stringSetDataValue = JSON.stringify(rule.setData.value);
            let stringValue = JSON.stringify(value);
            return JSON.parse(stringSetDataValue.replace(`"${SELECTED_PARAM}"`, stringValue));
        }
        return CExecution.executeRule(rule, jsonData, path, ({json, error}) => {
            if(json.hasOwnProperty(oldParamName)) {
                json[oldParamName] = setValue(json[oldParamName]);
            } else{
                error.messageData = {name: oldParamName};
                error.message = 'PROPERTY_NOT_EXIST';
                error.data = {...json};
            }
        });
    }

    static renameParam(rule, jsonData){
        const oldParamName = rule.selectedParam.name;
        const newParamName = rule.setData.name;
        const path = rule.selectedParam.path;
        return CExecution.executeRule(rule, jsonData, path, ({json, error}) => {
            if(json.hasOwnProperty(newParamName)) {
                error.messageData = {name: newParamName};
                error.message = 'PROPERTY_EXIST';
                error.data = {...json};
            } else{
                if(json.hasOwnProperty(oldParamName)) {
                    json[newParamName] = json[oldParamName];
                    delete json[oldParamName];
                } else{
                    error.messageData = {name: oldParamName};
                    error.message = 'PROPERTY_NOT_EXIST';
                    error.data = {...json};
                }
            }
        });
    }

    static removeParam(rule, jsonData){
        const oldParamName = rule.selectedParam.name;
        const path = rule.selectedParam.path;
        return CExecution.executeRule(rule, jsonData, path, ({json}) => {
            if(json.hasOwnProperty(oldParamName)) {
                delete json[oldParamName];
            }
        });
    }

    static addParamAfterSelected(rule, jsonData){
        const newParamName = rule.setData.name;
        const path = rule.selectedParam.path;
        return CExecution.executeRule(rule, jsonData, path, ({json, error, newParamValue}) => {
            if(json.hasOwnProperty(newParamName)) {
                error.messageData = {name: newParamName};
                error.message = 'PROPERTY_EXIST';
                error.data = {...json};
            } else{
                json[newParamName] = newParamValue;
            }
        });
    }

    static moveParam(rule, jsonData){
        const newParamName = rule.setData.name;
        const path = rule.setData.path;
        return CExecution.executeRule(rule, jsonData, path, ({json, error, newParamValue}) => {
            json[newParamName] = newParamValue;
        });
    }

    static setIteratorsForLoopOperators(rule, jsonData){
        const oldParamName = rule.selectedParam.name;
        const path = rule.selectedParam.path;
        return CExecution.executeRule(rule, jsonData, path, ({json}) => {
            if(json.hasOwnProperty(oldParamName)) {
                for(let i = 0; i < json[oldParamName].length; i++){
                    if(json[oldParamName][i].type === LOOP_OPERATOR){
                        json[oldParamName][i].iterator = CConnectorItem.getIterator(json[oldParamName], json[oldParamName][i], i > 0 ? i - 1 : 0);
                    }
                }
            }
        });
    }
    static setResultArrayForIdoitSystem(rule, json){
        let jsonData = {...json};
        let error = {message: '', data: null, messageData: {}};
        if(json && json.hasOwnProperty('fromConnector') && json.fromConnector.invoker.name === 'i-doit'
        || json && json.hasOwnProperty('toConnector') && json.toConnector.invoker.name === 'i-doit'){
            let jsonString = JSON.stringify(jsonData);
            jsonString = jsonString.replace(/success.result/g, 'success.[0].result');
            jsonData = JSON.parse(jsonString);
        }
        return {jsonData, error};
    }
    static setIteratorsInBrackets(rule, json){
        let error = {message: '', data: null, messageData: {}};
        let jsonString = JSON.stringify(json);
        jsonString = jsonString.replace(/\[]\./g, '[i].');
        const jsonData = JSON.parse(jsonString);
        return {jsonData, error};
    }
}