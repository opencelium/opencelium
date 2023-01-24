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

import CRequest from "./request/CRequest";
import CResponse from "./response/CResponse";

export const METHOD_TYPE_TEST = 'test';

/**
 * Operation class for XmlOperation, Invokers classes
 */
export default class COperation{

    constructor(name = '', type = '', request = null, response = null, invoker = null){
        this._name = name;
        this._type = this.checkType(type) ? type : '';
        this._request = this.convertRequest(request);
        this._response = this.convertResponse(response);
    }

    static createOperation(operation){
        let name = operation && operation.hasOwnProperty('name') ? operation.name : '';
        let type = operation && operation.hasOwnProperty('type') ? operation.type : '';
        let request = operation && operation.hasOwnProperty('request') ? operation.request : null;
        let response = operation && operation.hasOwnProperty('response') ? operation.response : null;
        return new COperation(name, type, request, response);
    }

    convertRequest(request){
        if(!(request instanceof CRequest)) {
            return CRequest.createRequest({...request, operation: this});
        }
        return request;
    }

    convertResponse(response){
        if(!(response instanceof CResponse)) {
            return CResponse.createResponse(response);
        }
        return response;
    }

    checkType(type){
        return type === METHOD_TYPE_TEST;
    }

    checkResponse(response){
        return !(response === null || response.success === null && response.fail === null);
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get type(){
        return this._type;
    }

    set type(type){
        if(this.checkType(type)) {
            this._type = type;
        }
    }

    get request(){
        return this._request;
    }

    set request(request){
        this._request = this.convertRequest(request);
    }

    get response(){
        return this._response;
    }

    set response(response){
        this._response = this.convertResponse(response);
    }

    getObject(){
        let obj = {
            name: this._name,
            type: this._type,
            request: this._request.getObject(),
            response: this._response.getObject(),
        };
        return obj;
    }
}