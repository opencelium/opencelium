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

import {EXCHANGE_TYPE_REQUEST, EXCHANGE_TYPE_RESPONSE, WRONG_EXCHANGE_TYPE} from '../../../../../utils/constants/data_types';


/**
 * (not used)
 */
export default class MethodParam{
    constructor(exchangeType, fieldType, methodKey, name, subFieldList = null){
        this._exchangeType = exchangeType === EXCHANGE_TYPE_RESPONSE || exchangeType === EXCHANGE_TYPE_REQUEST ? exchangeType : WRONG_EXCHANGE_TYPE;
        this._fieldType = fieldType;
        this._methodKey = methodKey;
        this._name = name;
        this._subFieldList = subFieldList;
    }

    get exchangeType(){
        return this._exchangeType;
    }

    set exchangeType(exchangeType){
        this._exchangeType = exchangeType;
    }

    get fieldType(){
        return this._fieldType;
    }

    set fieldType(fieldType){
        this._fieldType = fieldType;
    }

    get methodKey(){
        return this._methodKey;
    }

    set methodKey(methodKey){
        this._methodKey = methodKey;
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get subFieldList(){
        return this._subFieldList;
    }

    set subFieldList(subFieldList){
        this._subFieldList = subFieldList;
    }

    getObject(){
        return{
            description: this._exchangeType,
            simpleCode: this._fieldType,
            expertVar: this._methodKey,
            expertCode: this._name,
            language: this._subFieldList,
        };
    }
}