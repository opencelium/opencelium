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

import {consoleLog} from "../app";


/**
 * constant variables used in frontend and backend
 */

/**
 * types of field
*/
export const FIELD_TYPE_STRING = 'string';
export const FIELD_TYPE_ARRAY = 'array';
export const FIELD_TYPE_OBJECT = 'object';
export const WRONG_FIELD_TYPE = 'WRONG_FIELD_TYPE';

/**
 * check if the field type is valid
 */
export function isValidFieldType(fieldType){
    if(fieldType === FIELD_TYPE_ARRAY || fieldType === FIELD_TYPE_OBJECT || fieldType === FIELD_TYPE_STRING){
        return true;
    }
    consoleLog(WRONG_FIELD_TYPE);
    return false;
}

/**
 * types of exchange
 */
export const EXCHANGE_TYPE_RESPONSE = 'response';
export const EXCHANGE_TYPE_REQUEST = 'request';
export const WRONG_EXCHANGE_TYPE = 'WRONG_EXCHANGE_TYPE';

/**
 * check if the exchange type is valid
 */
export function isValidExchangeType(exchangeType){
    if(exchangeType === EXCHANGE_TYPE_RESPONSE || exchangeType === EXCHANGE_TYPE_REQUEST){
        return true;
    }
    consoleLog(WRONG_EXCHANGE_TYPE);
    return false;
}