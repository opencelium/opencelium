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

import {isEmptyObject, isString, isArray, isObject} from "@utils/app";
import {
    convertHeaderFormatToObject,
    parseHeader
} from "@change_component/form_elements/form_connection/form_methods/help";
export const METHOD_TYPES = [
    {value: 'POST', label: 'POST'},
    {value: 'GET', label: 'GET'},
    {value: 'PUT', label: 'PUT'},
    {value: 'DELETE', label: 'DELETE'},
];
/**
 * (not used)
 */
export default class CRequest{

    constructor(query = '', affix = '', body = {}, method = '', header = [], operation = null){
        this._operation = operation ? operation : null;
        const parsedQuery = this.parseQuery(query);
        this._query = parsedQuery.query;
        this._affix = parsedQuery.affix;
        //this._body = body === null ? {} : body;
        this.body = `<?xml version="1.0" encoding="UTF-8" ?>
<invoker type="RESTful">
    <name>trello</name>
    <description>trello description</description>
    <hint>This interface provides the apikey auth. First you need to create a apikey token (https://trello.com/app-key/). Check out the documentation https://developer.atlassian.com/cloud/trello/rest/</hint>
    <requiredData>
        <item name="url" type="string" visibility="private">https://api.trello.com</item>
        <item name="username" type="string" visibility="public"/>
        <item name="key" type="string" visibility="public"/>
        <item name="token" type="string" visibility="protected"/>
    </requiredData></invoker>`;
        this._invokerBody = body === null ? {} : body;
        this._method = method;
        this._header = parseHeader(header);
    }

    static createRequest(request = null){
        let query = request && request.hasOwnProperty('endpoint') ? request.endpoint : '';
        let affix = '';
        let body = request && request.hasOwnProperty('body') ? request.body : {};
        let method = request && request.hasOwnProperty('method') ? request.method : '';
        let header = request && request.hasOwnProperty('header') ? request.header : [];
        let operation = request && request.hasOwnProperty('operation') ? request.operation : null;
        return new CRequest(query, affix, body, method, header, operation);
    }

    parseQuery(query){
        let result = {
            query,
            affix: '',
        };
        if(this._operation){
            let endpoint = this._operation.request ? this._operation.request.query : '';
            if(endpoint){
                result.affix = query.substring(endpoint.length + 1, query.length);
                result.query = endpoint;
            }
        }
        return result;
    }

    checkHeaderItem(headerItem){
        return headerItem && headerItem.hasOwnProperty('name') && headerItem.hasOwnProperty('value');
    }

    updateQueryAndAffix(){
        const parsedQuery = this.parseQuery(this._query);
        this._query = parsedQuery.query;
        this._affix = parsedQuery.affix;
    }

    get query(){
        return this._query;
    }

    set query(query){
        this._query = query;
    }

    get affix(){
        return this._affix;
    }

    set affix(affix){
        if(isString(affix)) {
            this._affix = affix;
        }
    }

    get body(){
        return this._body;
    }

    set body(body){
        this._body = body;
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
        this.updateQueryAndAffix();
    }

    get invokerBody(){
        return this._invokerBody;
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

    getObject(){
        let obj = {
            endpoint: this._affix !== '' ? `${this._query}/${this._affix}` : this._query,
            body: isEmptyObject(this._body) ? null : this._body,
            method: this._method,
        };
        if(this._header && this._header.length > 0){
            obj.header = convertHeaderFormatToObject(this._header);
        }
        return obj;
    }
}