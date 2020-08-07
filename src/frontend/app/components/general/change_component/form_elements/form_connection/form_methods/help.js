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
import {
    FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT,
    FIELD_TYPE_STRING
} from "@classes/components/content/connection/method/CMethodItem";
import {ATTRIBUTES_MARK, VALUE_MARK} from "@classes/components/content/invoker/CBody";

/**
 * constants from backend
 */
export const ARRAY_SIGN = '[]';


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

export function hasArrayMark(str){
    let splitStr = str.split('.');
    if(splitStr.length > 1){
        let potentialArrayMark = splitStr[0];
        if(potentialArrayMark.length > 2){
            if(potentialArrayMark[0] === '[' && potentialArrayMark[potentialArrayMark.length - 1] === ']'){
                if(isNumber(potentialArrayMark.substring(1, potentialArrayMark.length - 1))){
                    return true;
                }
            }
        }
    }
    return false;
}

export function getFieldsForSelectSearch(invokerBody, searchField, forAttributes = false){
    let result = [];
    let splitValue = searchField.split('.');
    let subValue = invokerBody;
    if(subValue) {
        for (let i = 0; i < splitValue.length; i++) {
            let subProperty = splitValue[i] !== '@' ? splitValue[i] : ATTRIBUTES_MARK;
            let hasProperty = subValue.hasOwnProperty(subProperty);
            if (i < splitValue.length - 1) {
                if (hasProperty) {
                    let elem = subValue[subProperty];
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
                hasProperty = subValue.hasOwnProperty(subProperty);
                if (hasProperty) {
                    let elem = subValue[subProperty];
                    let value = subProperty;
                    if(value === ATTRIBUTES_MARK){
                        for (let item in elem) {
                            result.push({value: `@${item}`, type: FIELD_TYPE_STRING, label: item});
                        }
                        return result;
                    }
                    if(value === VALUE_MARK){
                        return [];
                    }
                    if(forAttributes){
                        value = `@${value}`;
                    }
                    if (isString(elem)) {
                        result.push({value, type: FIELD_TYPE_STRING});
                    } else if (isArray(elem)) {
                        result.push({value, type: FIELD_TYPE_ARRAY});
                    } else {
                        result.push({value, type: FIELD_TYPE_OBJECT});
                    }
                } else {
                    for (let item in subValue) {
                        if (item.toLowerCase().includes(subProperty.toLowerCase())) {
                            let value = item;
                            let type = isString(subValue[item]) ? FIELD_TYPE_STRING ? isArray(subValue[item]) : FIELD_TYPE_ARRAY : FIELD_TYPE_OBJECT;
                            if(value === ATTRIBUTES_MARK){
                                value = '@';
                                type = FIELD_TYPE_STRING;
                            }
                            if(value === VALUE_MARK){
                                continue;
                            }
                            result.push({value, type});
                        }
                    }
                }
            }
        }
    }
    return result;
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