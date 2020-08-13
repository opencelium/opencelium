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


import CXmlOperation from "./CXmlOperation";
import CInvoker from "../invoker/CInvoker";
const AUTH_API_KEY = 'apikey';
const AUTH_TOKEN = 'token';
const AUTH_BASIC = 'basic';
const AUTH_ENDPOINT = 'endpointAuth';

const API_KEY_DATA = [
    {_attributes: {name: 'url', type: 'string', visibility: 'public'}},
    {_attributes: {name: 'apikey', type: 'string', visibility: 'public'}},
];
const TOKEN_DATA = [
    {_attributes: {name: 'url', type: 'string', visibility: 'public'}},
    {_attributes: {name: 'user', type: 'string', visibility: 'public'}},
    {_attributes: {name: 'password', type: 'string', visibility: 'protected'}},
    {_attributes: {name: 'token', type: 'string', visibility: 'private'}, _text: '%{body.result}'},
];
const BASIC_DATA = [
    {_attributes: {name: 'url', type: 'string', visibility: 'public'}},
    {_attributes: {name: 'username', type: 'string', visibility: 'public'}},
    {_attributes: {name: 'password', type: 'string', visibility: 'protected'}},
    {_attributes: {name: 'token', type: 'string', visibility: 'private'}, _text: 'Basic {username:password}'},
];
const ENDPOINT_DATA = [
    {_attributes: {name: 'url', type: 'string', visibility: 'public'}},
    {_attributes: {name: 'UserLogin', type: 'string', visibility: 'public'}},
    {_attributes: {name: 'Password', type: 'string', visibility: 'protected'}},
    {_attributes: {name: 'WebService', type: 'string', visibility: 'public'}},
];
const INVOKER_RESTFUL = 'RESTful';

/**
 * XmlInvoker class
 */
export default class CXmlInvoker{

    constructor(invoker = CInvoker.createInvoker()){
        this._attributes = {type: INVOKER_RESTFUL};
        this._name = invoker.name;
        this._description = invoker.description;
        this._hint = invoker.hint;
        this._icon = invoker.icon;
        this._authType = invoker.auth;
        this._requiredData = this.getRequiredData();
        this._operations = this.convertOperations(invoker.operations);
    }

    static createInvoker(invoker){
        return new CXmlInvoker(invoker);
    }

    getRequiredData(){
        let result = {item: []};
        switch(this._authType){
            case AUTH_API_KEY:
                result.item = API_KEY_DATA;
                break;
            case AUTH_TOKEN:
                result.item = TOKEN_DATA;
                break;
            case AUTH_BASIC:
                result.item = BASIC_DATA;
                break;
            case AUTH_ENDPOINT:
                result.item = ENDPOINT_DATA;
                break;
        }
        if(result.item.length === 0){
            result = null;
        }
        return result;
    }

    convertOperations(operations){
        let result = {operation: []};
        for(let i = 0; i < operations.length; i++){
            result.operation.push(this.convertOperation(operations[i]));
        }
        if(result.operation.length === 0){
            result = null;
        }
        return result;
    }

    convertOperation(operation){
        if(!(operation instanceof CXmlOperation)) {
            return CXmlOperation.createOperation(operation);
        }
        return operation;
    }

    getObject(){
        let operations = {operation: []};
        if(this._operations !== null) {
            for (let i = 0; i < this._operations.operation.length; i++) {
                operations.operation.push(this._operations.operation[i].getObject());
            }
        } else{
            operations = null;
        }
        let obj = {
            _attributes: this._attributes,
            name: this._name,
            description: this._description,
            hint: this._hint,
            icon: this._icon,
            requiredData: this._requiredData,
            authType: this._authType,
            operations,
        };
        return obj;
    }
}