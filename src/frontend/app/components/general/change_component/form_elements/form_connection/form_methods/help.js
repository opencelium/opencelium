/*
 * Copyright (C) <2020>  <becon GmbH>
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

import {isArray, isNumber, isObject, isString} from "@utils/app";
import {ARRAY_SIGN, WHOLE_ARRAY} from "@classes/components/content/invoker/response/CResponseResult";



/**
 * circle with background color to select method
 */
export const dotColor = (color = '#ccc') => ({
    alignItems: 'center',
    display: 'flex',

    ':before': {
        backgroundColor: color,
        borderRadius: 10,
        content: '" "',
        display: 'block',
        marginRight: 8,
        height: 10,
        width: 10,
    },
});

/**
 * to mark field name as array
 */
export function markFieldNameAsArray(fieldName){
    if(isString(fieldName)) {
        return `${fieldName}${ARRAY_SIGN}`;
    }
    return fieldName;
}

export function convertFieldNameForBackend(invokerBody, fieldName){
    let fieldNameSplitted = fieldName.split('.');
    let subValue = invokerBody;
    let result = '';
    for(let i = 0; i < fieldNameSplitted.length; i++){
        let hasProperty = subValue.hasOwnProperty(fieldNameSplitted[i]);
        if(hasProperty) {
            let elem = subValue[fieldNameSplitted[i]];
            if (isString(elem)) {
                result += `${fieldNameSplitted[i]}`;
                subValue = elem;
            } else if (isArray(elem) && fieldNameSplitted[i] !== WHOLE_ARRAY) {
                result += markFieldNameAsArray(fieldNameSplitted[i]);
                subValue = elem[0];
            } else {
                result += `${fieldNameSplitted[i]}`;
                subValue = elem;
            }
        } else{
            result += `${fieldNameSplitted[i]}`;
        }
        if(i !== fieldNameSplitted.length - 1){
            result += '.';
        }
    }
    return result;
}

export function hasArrayMark(str){
    let splitStr = str.split('.');
    if(splitStr.length > 1){
        let potentialArrayMark = splitStr[0];
        if(potentialArrayMark.length > 2){
            if(potentialArrayMark[0] === '[' && potentialArrayMark[potentialArrayMark.length - 1] === ']'){
                if(potentialArrayMark.substring(1, potentialArrayMark.length - 1) !== '*'){
                    return true;
                }
            }
        }
    }
    return false;
}

export function parseHeader(header){
    if(isArray(header)){
        return header;
    }
    let newHeader = [];
    if(isObject(header)){
        for(let param in header){
            newHeader.push({name: param, value: header[param]});
        }
        return newHeader;
    }
    return [];
}

export function convertHeaderFormatToObject(header){
    let result = {};
    if(isArray(header)){
        for(let i = 0; i < header.length; i++){
            result[header[i].name] = header[i].value;
        }
    }
    return result;
}