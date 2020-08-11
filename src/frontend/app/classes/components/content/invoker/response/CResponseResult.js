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
    hasArrayMark, parseHeader
} from "@change_component/form_elements/form_connection/form_methods/help";
import CBody from "@classes/components/content/invoker/CBody";
import {instanceOf} from "prop-types";
import {FIELD_TYPE_ARRAY} from "@classes/components/content/connection/method/CMethodItem";

/**
 * Class ResponseResult as a Parent for Success and Fail classes
 */
export default class CResponseResult{

    constructor(status = '', body = null, header = []){
        this._status = status;
        this._body = CBody.createBody(body);
        this._header = parseHeader(header);
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
        let type = this.getBodyType();
        if(type === FIELD_TYPE_ARRAY){
            if(hasArrayMark(searchField)){
                let index = searchField.indexOf('.') + 1;
                return this._body.getFieldsForSelectSearch(searchField.substring(index));
            } else{
                return [
                    {value: '[*]', type: FIELD_TYPE_ARRAY, label: 'Whole Result'},
                    {value: '[0]', type: FIELD_TYPE_ARRAY, label: 'One Element of Result'}
                ];
            }
        } else {
            return this._body.getFieldsForSelectSearch(searchField);
        }
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