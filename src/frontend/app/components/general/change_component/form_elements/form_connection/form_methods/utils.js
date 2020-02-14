/*
 * Copyright (C) <2019>  <becon GmbH>
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



import {isArray, isString} from "../../../../../../utils/app";

/**
 * constants from backend
 */
export const ARRAY_SIGN = '[]';
export const FIELD_TYPE_RESPONSE = 'response';
export const FIELD_TYPE_REQUEST = 'request';
export const FIELD_TYPE_ARRAY = 'array';
export const FIELD_TYPE_OBJECT = 'object';
export const FIELD_TYPE_STRING = 'string';


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
export function markFieldNameAsArray(fieldType, name){
    if(fieldType === FIELD_TYPE_ARRAY){
        return `${name}${ARRAY_SIGN}`;
    } else{
        return name;
    }
}

/**
 * to check param is array
 */
export function checkIfParamIsArray(param){
    return param.name.slice(-2) === ARRAY_SIGN;
}

export function convertFieldNameForBackend(invokerBody, fieldName, arrayCanBeEmpty = false){
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
            } else if (isArray(elem)) {
                result += `${fieldNameSplitted[i]}[]`;
                subValue = elem[0];
            } else {
                subValue = elem;
                result += `${fieldNameSplitted[i]}`;
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


export function getFieldsForSelectSearch(invokerBody, searchField){
    let result = [];
    let splitValue = searchField.split('.');
    let subValue = invokerBody;
    if(subValue) {
        for (let i = 0; i < splitValue.length; i++) {
            let hasProperty = subValue.hasOwnProperty(splitValue[i]);
            if (i < splitValue.length - 1) {
                if (hasProperty) {
                    let elem = subValue[splitValue[i]];
                    if (isString(elem)) {
                        subValue = elem;
                    } else if (isArray(elem)) {
                        subValue = elem[0];
                    } else {
                        subValue = elem;
                    }
                    if(!subValue){
                        return [];
                    }
                } else {
                    return [];
                }
            } else if (i === splitValue.length - 1) {
                hasProperty = subValue.hasOwnProperty(splitValue[i]);
                if (hasProperty) {
                    let elem = subValue[splitValue[i]];
                    if (isString(elem)) {
                        result.push({value: splitValue[i], type: FIELD_TYPE_STRING});
                    } else if (isArray(elem)) {
                        result.push({value: splitValue[i], type: FIELD_TYPE_ARRAY});
                    } else {
                        result.push({value: splitValue[i], type: FIELD_TYPE_OBJECT});
                    }
                } else {
                    for (let item in subValue) {
                        if (item.toLowerCase().includes(splitValue[i].toLowerCase())) {
                            if (isString(subValue[item])) {
                                result.push({value: item, type: FIELD_TYPE_STRING});
                            } else if (isArray(subValue[item])) {
                                result.push({value: item, type: FIELD_TYPE_ARRAY});
                            } else {
                                result.push({value: item, type: FIELD_TYPE_OBJECT});
                            }
                        }
                    }
                }
            }
        }
    }
    return result;
}