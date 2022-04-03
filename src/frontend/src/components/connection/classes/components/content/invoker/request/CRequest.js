

/*
 * Copyright (C) <2022>  <becon GmbH>
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

import {consoleLog, isArray, isString} from "@utils/app";
import {
    convertHeaderFormatToObject,
    parseHeader
} from "@change_component/form_elements/form_connection/form_methods/help";
import CBody from "@classes/components/content/invoker/CBody";
import {instanceOf} from "prop-types";
import {API_METHOD} from "@utils/constants/app";
import COperation from "@classes/components/content/invoker/COperation";
export const METHOD_TYPES = [
    {value: API_METHOD.POST, label: 'POST'},
    {value: API_METHOD.GET, label: 'GET'},
    {value: API_METHOD.PUT, label: 'PUT'},
    {value: API_METHOD.DELETE, label: 'DELETE'},
];
/**
 * Request class for class Operation
 */
export default class CRequest{

    constructor(endpoint = '', body = null, method = '', header = [], operation = null){
        this._operation = operation ? operation : null;
        this._endpoint = endpoint;
        this._body = CBody.createBody(body);
        this._invokerBody = CBody.createBody(CRequest.getInvokerBody(operation, body));
        this._method = method;
        this._header = parseHeader(header);
    }

    static createRequest(request = null){
        let endpoint = request && request.hasOwnProperty('endpoint') ? request.endpoint : '';
        let body = request && request.hasOwnProperty('body') ? request.body : null;
        let method = request && request.hasOwnProperty('method') ? request.method : '';
        let header = request && request.hasOwnProperty('header') ? request.header : [];
        let operation = request && request.hasOwnProperty('operation') ? request.operation : null;
        return new CRequest(endpoint, body, method, header, operation);
    }

    static getInvokerBody(operation, body){
        if(operation instanceof COperation){
            if(operation.request && operation.request.invokerBody){
                return {...operation.request.invokerBody.fields};
            }
        }
        return body;
    }

    checkHeaderItem(headerItem){
        return headerItem && headerItem.hasOwnProperty('name') && headerItem.hasOwnProperty('value');
    }

    get endpoint(){
        return this._endpoint;
    }

    set endpoint(endpoint){
        if(isString(endpoint)) {
            this._endpoint = endpoint;
        } else{
            consoleError(`CRequest has a wrong set of endpoint: ${endpoint}`);
        }
    }

    get body(){
        return this._body;
    }

    set body(body){
        if(!instanceOf(CBody)) {
            this._body = CBody.createBody(body);
        } else{
            this._body = body;
        }
    }

    getBodyFields(){
        return this._body.fields;
    }

    setBodyFields(fields){
        this._body.fields = fields;
    }

    get method(){
        return this._method;
    }

    getMethodForSelect(){
        return METHOD_TYPES.find(m => m.value === this._method);
    }

    set method(method){
        this._method = method;
    }

    get header(){
        return this._header;
    }

    get operation(){
        return this._operation;
    }

    set operation(operation){
        this._operation = operation;
    }

    get invokerBody(){
        return this._invokerBody;
    }

    setHeader(headerItems){
        this._header = [];
        if(isArray(headerItems)) {
            for (let i = 0; i < headerItems.length; i++) {
                this._header.push(headerItems[i]);
            }
        } else{
            consoleLog('CRequest. HeaderItems should be an array.');
        }
    }

    addHeader(headerItem){
        if(this.checkHeaderItem(headerItem)) {
            this._header.push(headerItem);
        }
    }

    updateHeaderByName(header){
        let index = this._header.findIndex(h => h.name === header.name);
        if(index !== -1) {
            this._header[index] = header;
        }
    }

    removeHeaderByIndex(index){
        if(index !== -1) {
            this._header.splice(index, 1);
        }
    }

    removeHeaderByName(name){
        let index = this._header.findIndex(h => h.name === name);
        this.removeHeaderByIndex(index);
    }

    /**
     * get object of the class
     * @param params =
     *      {
     *          bodyOnlyConvert: bool,      //if you need just convert the object and not get object of the class (difference read in CBody class)
     *      }
     * @returns Object (mostly for backend api request only)
     */
    getObject(params = {bodyOnlyConvert: false}){
        let obj = {
            endpoint: this._endpoint,
            body: params.bodyOnlyConvert ? this._body.convertToObject() : this._body.getObject(),
            method: this._method,
        };
        if(this._header && this._header.length > 0){
            obj.header = convertHeaderFormatToObject(this._header);
        }
        return obj;
    }
}