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

import CRequest from "../../invoker/request/CRequest";
import CResponse from "../../invoker/response/CResponse";
import CInvoker from "../../invoker/CInvoker";

export const FIELD_TYPE_STRING = 'string';
export const FIELD_TYPE_ARRAY = 'array';
export const FIELD_TYPE_OBJECT = 'object';

/**
 * (not used)
 */
export default class CMethodItem{

    constructor(index = '', name = '', color = '', request = null, response = null, invoker = null, error = null){
        this._index = index;
        this._invoker = this.convertInvoker(invoker);
        this._name = name;
        this._color = color;
        this._request = this.convertRequest(request);
        this._response = this.convertResponse(response);
        this._error = this.checkError(error);
    }

    static createMethodItem(methodItem){
        let index = methodItem && methodItem.hasOwnProperty('index') ? methodItem.index : '';
        let name = methodItem && methodItem.hasOwnProperty('name') ? methodItem.name : '';
        let color = methodItem && methodItem.hasOwnProperty('color') ? methodItem.color : '';
        let request = methodItem ? methodItem.request : null;
        let response = methodItem ? methodItem.response : null;
        let invoker = methodItem && methodItem.hasOwnProperty('invoker') ? methodItem.invoker : null;
        let error = methodItem && methodItem.hasOwnProperty('error') ? methodItem.error : null;
        return new CMethodItem(index, name, color, request, response, invoker, error);
    }

    checkError(error){
        if(error && error.hasOwnProperty('hasError') && error.hasOwnProperty('location')){
            return error;
        }
        return {
            hasError: false,
            location: '',
        };
    }

    convertRequest(request){
        if(!(request instanceof CRequest)) {
            let operation = this._invoker && this._invoker.operations ? this._invoker.operations.find(o => o.name === this._name) : null;
            return CRequest.createRequest({...request, operation});
        }
        return request;
    }

    convertResponse(response){
        if(!(response instanceof CResponse)) {
            return CResponse.createResponse(response);
        }
        return response;
    }

    convertInvoker(invoker){
        if(!(invoker instanceof CInvoker)) {
            return CInvoker.createInvoker(invoker);
        }
        return invoker;
    }

    updateOperation(){
        let operation = this._invoker && this._invoker.operations ? this._invoker.operations.find(o => o.name === this._name) : null;
        this.request.operation = operation;
    }

    getValueForSelectInput(connector){
        return {label: this._name, value: `${connector.getPrefixForMethodOption()}${this._index}`, color: this._color};
    }

    get index(){
        return this._index;
    }

    set index(index){
        this._index = index;
    }

    get name(){
        return this._name;
    }

    get color(){
        return this._color;
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

    get invoker(){
        return this._invoker;
    }

    set invoker(invoker){
        this._invoker = this.convertInvoker(invoker);
        this.updateOperation();
    }

    setRequestEndpointAffix(affix){
        this._request._affix = affix;
    }

    setRequestBody(body){
        this._request._body = body;
    }

    setResponseFailStatus(status){
        this._response._fail._status = status;
    }

    setResponseFailStatus(body){
        this._response._fail._body = body;
    }

    setResponseSuccessStatus(status){
        this._response._success._status = status;
    }

    setResponseSuccessStatus(body){
        this._response._success._body = body;
    }

    get error(){
        return this._error;
    }

    set error(error){
        this._error = this.checkError(error);
    }

    getObject(){
        let obj = {
            name: this._name,
            request: this._request.getObject(),
            response: this._response.getObject(),
        };
        if(this._index !== ''){
            obj.index = this._index;
        }
        if(this._color !== ''){
            obj.color = this._color;
        }
        return obj;
    }
}