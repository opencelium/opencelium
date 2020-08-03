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


import {
    convertFieldNameForBackend, convertHeaderFormatToObject,
    getFieldsForSelectSearch, parseHeader
} from "@change_component/form_elements/form_connection/form_methods/help";
import CBody, {BODY_TYPE} from "@classes/components/content/invoker/CBody";
import {instanceOf} from "prop-types";

/**
 * Class Success for Response
 */
export default class CSuccess{

    constructor(status = '', body = null, header = []){
        this._status = status;
        this._body = CBody.createBody(body);
        this._header = parseHeader(header);
    }

    static createSuccess(success = null){
        let status = success && success.hasOwnProperty('status') ? success.status : '';
        let body = success && success.hasOwnProperty('body') ? success.body : null;
        let header = success && success.hasOwnProperty('header') ? success.header : [];
        return new CSuccess(status, body, header);
    }

    checkHeaderItem(headerItem){
        return headerItem && headerItem.hasOwnProperty('name') && headerItem.hasOwnProperty('value');
    }

    get status(){
        return this._status;
    }

    set status(status){
        this._status = status;
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

    getBodyType(){
        return this._body.type;
    }

    get header(){
        return this._header;
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

    convertFieldNameForBackend(fieldName){
        return convertFieldNameForBackend(this.getBodyFields(), fieldName);
    }

    getFields(searchField){
        let fields = this.getBodyFields();
        let type = this.getBodyType();
        if(type === BODY_TYPE.ARRAY && fields.length > 0){
            fields = fields[0];
        }
        return getFieldsForSelectSearch(fields, searchField);
    }

    getObject(){
        let obj = {
            status: this._status,
            body: this._body.getObject(),
        };
        if(this._header && this._header.length > 0){
            obj.header = convertHeaderFormatToObject(this._header);
        }
        return obj;
    }
}