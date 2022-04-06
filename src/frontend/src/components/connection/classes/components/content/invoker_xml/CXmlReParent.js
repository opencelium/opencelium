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

import {isEmptyObject, isString} from "@utils/app";
import CBody from "@classes/components/content/invoker/CBody";

/**
 * XmlReParent Class for XmlRequest, XmlSuccess and XmlFail classes
 */
export default class CXmlReParent{
    constructor(reElement){
        this._header = this.getHeader(reElement.header);
        this._body = this.getBody(reElement.body);
    }

    getHeader(header){
        let result = {item: []};
        for(let i = 0; i < header.length; i++){
            result.item.push({
                _attributes: {
                    name: header[i].name,
                    type: 'string'
                },
                _text: header[i].value
            });
        }
        if(result.item.length === 0){
            result = null;
        }
        return result;
    }

    getBody(body){
        let result = {field: [], };
        switch (body.constructor){
            case CBody:
                result._attributes = {data: body.data, format: body.format, type: body.type};
                result.field = this.getSubBody(body.fields);
                break;
            default:
                result.field = this.getSubBody(body);
                break;
        }
        return result;
    }

    getSubBody(data){
        if(!data || isEmptyObject(data)){
            return null;
        }
        let result = [];
        let values = data.length && data.length > 0 ? data : [data];
        for(let i = 0; i < values.length; i++) {
            if(values[i]) {
                let keys = Object.keys(values[i]);
                for (let j = 0; j < keys.length; j++) {
                    let xmlField = {_attributes: {name: keys[j], type: ''}};
                    let field = data[keys[j]];
                    let typeOfField = typeof field;
                    switch (typeOfField) {
                        case 'string':
                            xmlField._attributes.type = 'string';
                            if (isString(field) && field !== '') {
                                xmlField._text = field;
                            }
                            break;
                        case 'object':
                            if (field && field.hasOwnProperty('length') && field.length >= 0) {
                                xmlField._attributes.type = 'array';
                                if (field.length > 0) {
                                    xmlField.field = this.getSubBody(field);
                                }
                            } else {
                                xmlField._attributes.type = 'object';
                                if (field && !isEmptyObject(field)) {
                                    xmlField.field = this.getSubBody(field);
                                }
                            }
                            break;
                    }
                    result.push(xmlField);
                }
            }
        }
        return result;
    }
}