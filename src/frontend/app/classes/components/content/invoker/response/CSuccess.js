/*
 * Copyright (C) <2019>  <becon GmbH>
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


import {isString, isArray, isEmptyObject} from "../../../../../utils/app";
import {FIELD_TYPE_ARRAY, FIELD_TYPE_OBJECT, FIELD_TYPE_STRING} from "../../connection/method/CMethodItem";
import {
    convertFieldNameForBackend,
    getFieldsForSelectSearch
} from "../../../../../components/general/change_component/form_elements/form_connection/form_methods/utils";

/**
 * (not used)
 */
export default class CSuccess{

    constructor(status = '', body = {}, header = []){
        this._status = status;
        this._body = body === null ? {} : body;
        this._header = header;
    }

    static createSuccess(success){
        let status = success && success.hasOwnProperty('status') ? success.status : '';
        let body = success && success.hasOwnProperty('body') ? success.body : {};
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
        this._body = body;
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
        return convertFieldNameForBackend(this._body, fieldName);
    }

    getFields(searchField){
        return getFieldsForSelectSearch(this._body, searchField);
    }

    getObject(){
        let obj = {
            status: this._status,
            body: isEmptyObject(this._body) ? null : this._body,
        };
        if(this._header && this._header.length > 0){
            obj.header = this._header;
        }
        return obj;
    }
}