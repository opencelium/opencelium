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

import {isArray, isNumber, isObject, isString} from "@application/utils/utils";


export const ARRAY_SIGN = '[]';
export const WHOLE_ARRAY = '[*]';

/**
 * circle with background color to select method
 */
export const dotColor = (color = '#ccc') => (color !== '#ccc' ? {
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
} : {});

/**
 * to mark field name as array
 */
export function markFieldNameAsArray(fieldName, index = null){
    if(isString(fieldName)) {
        return isNumber(index) ? `${fieldName}[${index}]` : `${fieldName}${ARRAY_SIGN}`;
    }
    return fieldName;
}
/**
 * to mark field name as array
 */
export function clearFieldNameFromArraySign(fieldName){
    if(isString(fieldName)) {
        return fieldName.replace(ARRAY_SIGN, '');
    }
    return fieldName;
}

export function convertFieldNameForBackend(invokerBody, fieldName){
    const tokens = isString(fieldName)
        ? fieldName.match(/\['[^']+'\]|\["[^"]+"\]|\[[^\]]+\]|[^.[\]]+/g) || []
        : [];
    const resultParts = [];
    let subValue = invokerBody;

    const hasOwn = (value, key) =>
        !!value &&
        typeof value === 'object' &&
        Object.prototype.hasOwnProperty.call(value, key);

    const isQuotedToken = (token) => /^\['[^']+'\]$|^\["[^"]+"\]$/.test(token);
    const isBracketToken = (token) => /^\[[^\]]+\]$/.test(token) && !isQuotedToken(token);
    const getQuotedKey = (token) => {
        const match = token.match(/^\['([^']+)'\]$|^\["([^"]+)"\]$/);
        return match ? (match[1] !== undefined ? match[1] : match[2]) : token;
    };
    const appendBracketToLastPart = (token) => {
        if (resultParts.length > 0) {
            resultParts[resultParts.length - 1] += token;
        } else {
            resultParts.push(token);
        }
    };

    for(let i = 0; i < tokens.length; i++){
        const token = tokens[i];

        if (isQuotedToken(token)) {
            const key = getQuotedKey(token);
            resultParts.push(token.replace(/^\["([^"]+)"\]$/, "['$1']"));
            subValue = hasOwn(subValue, key) ? subValue[key] : undefined;
            continue;
        }

        if (isBracketToken(token)) {
            appendBracketToLastPart(token);

            if (isArray(subValue)) {
                subValue = subValue[0];
            } else {
                const inner = token.slice(1, -1);
                subValue = hasOwn(subValue, inner) ? subValue[inner] : undefined;
            }
            continue;
        }

        const key = token;

        if (isArray(subValue) && isNumber(parseInt(key))) {
            appendBracketToLastPart(`[${key}]`);
            subValue = subValue[0];
            continue;
        }

        if (hasOwn(subValue, key)) {
            const elem = subValue[key];

            if (isArray(elem) && key !== WHOLE_ARRAY) {
                const nextToken = i + 1 < tokens.length ? tokens[i + 1] : '';

                if (isBracketToken(nextToken)) {
                    resultParts.push(`${key}${nextToken}`);
                    subValue = elem[0];
                    i++;
                    continue;
                }

                if (isNumber(parseInt(nextToken))) {
                    resultParts.push(markFieldNameAsArray(key, parseInt(nextToken)));
                    subValue = elem[0];
                    i++;
                    continue;
                }

                resultParts.push(markFieldNameAsArray(key));
                subValue = elem[0];
                continue;
            }

            resultParts.push(key);
            subValue = elem;
        } else{
            resultParts.push(key);
            subValue = undefined;
        }
    }

    return resultParts.join('.');
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