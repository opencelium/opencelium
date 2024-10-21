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

import {isArray, isEmptyObject, isObject, isString} from "@application/utils/utils";
import {
    FIELD_TYPE_ARRAY,
    FIELD_TYPE_OBJECT,
    FIELD_TYPE_STRING
} from "@entity/connection/components/classes/components/content/connection/method/CMethodItem";
import {WHOLE_ARRAY} from "@entity/connection/components/classes/components/content/invoker/response/CResponseResult";
import {putAsterixInEmptyBrackets} from "@change_component/form_elements/form_connection/form_svg/utils";

export const BODY_FORMAT = {
    JSON: 'json',
    XML: 'xml',
    X_WWW_URL_ENCODED: 'x-www-form-urlencoded'
};

export const BODY_DATA = {
    RAW: 'raw',
    GRAPHQL: 'graphql',
};

export const VALUE_PROPERTY = '__oc__value';
export const ATTRIBUTES_PROPERTY = '__oc__attributes';
export const ATTRIBUTES_MARK = '@';

/**
 * Body class for Request, Success and Fail classes
 */
export default class CBody{
    constructor(type = FIELD_TYPE_OBJECT, format = BODY_FORMAT.JSON, data = BODY_DATA.RAW, fields) {
        this._type = this.checkType(type) ? type : FIELD_TYPE_OBJECT;
        this._format = this.checkFormat(format) ? format : BODY_FORMAT.JSON;
        this._data = this.checkData(data) ? data : BODY_DATA.RAW;
        this._fields = fields === null ? {} : this._type === FIELD_TYPE_ARRAY && !isArray(fields) ? [fields] : fields;
        this._fields = putAsterixInEmptyBrackets(this._fields);
    }

    static createBody(body){
        const type = body && body.hasOwnProperty('type') ? body.type : FIELD_TYPE_OBJECT;
        const format = body && body.hasOwnProperty('format') ? body.format : BODY_FORMAT.JSON;
        const data = body && body.hasOwnProperty('data') ? body.data : BODY_DATA.RAW;
        const fields = body && body.hasOwnProperty('fields') ? body.fields : isObject(body) ? body : {};
        return new CBody(type, format, data, fields);
    }

    static webhookSnippet(webhook) {
        return "${" + webhook + "}";
    }

    checkType(bodyType){
        return true;
        if(bodyType === FIELD_TYPE_STRING || bodyType === FIELD_TYPE_OBJECT || bodyType === FIELD_TYPE_ARRAY){
            return true;
        }
        //consoleLog(`Body has a wrong type: ${bodyType}`);
        return false;
    }

    checkFormat(bodyFormat){
        return true;
        for(const format in BODY_FORMAT) {
            if(bodyFormat === BODY_FORMAT[format]){
                return true;
            }
        }
        //consoleLog(`Body has a wrong format: ${bodyFormat}`);
        return false;
    }

    checkData(bodyData){
        for(const data in BODY_DATA) {
            if(bodyData === BODY_DATA[data]){
                return true;
            }
        }
        return false;
    }

    get type(){
        return this._type;
    }

    set type(type){
        this._type = this.checkType(type) ? type : FIELD_TYPE_STRING;
    }

    get format(){
        return this._format;
    }

    set format(format){
        this._format = this.checkFormat(format) ? format : BODY_FORMAT.JSON;
    }

    get data(){
        return this._data;
    }

    set data(data){
        this._data = this.checkData(data) ? data : BODY_DATA.RAW;
    }

    get fields(){
        return this._fields;
    }

    set fields(fields){
        if(isArray(fields)){
            this._type = FIELD_TYPE_ARRAY;
        }
        if(isObject(fields)){
            this._type = FIELD_TYPE_OBJECT;
        }
        this._fields = fields === null ? {} : fields;
    }

    _isAttributeProperty(property){
        return property === ATTRIBUTES_PROPERTY;
    }

    _isValueProperty(property){
        return property === VALUE_PROPERTY;
    }

    _getProperty(property){
        return property.length > 0 && ATTRIBUTES_MARK === property[0] ? ATTRIBUTES_PROPERTY : property;
    }

    _getSubField(fields, property){
        if (isString(fields[property])) {
            fields = fields[property];
        } else if (isArray(fields[property])) {
            fields = fields[property][0];
        } else {
            fields = fields[property];
        }
        return fields;
    }

    _addFoundedProperty(result, fields, property, connector = null){
        let type = FIELD_TYPE_OBJECT;
        if(isString(fields[property])){
            type = FIELD_TYPE_STRING;
            if (connector !== null) {
                const previousLoopOperators = connector.getPreviousLoopOperators();
                for (let i = 0; i < previousLoopOperators.length; i++) {
                    const loop = previousLoopOperators[i];
                    if (loop.isSplitString() && loop.condition.leftStatement.field === property) {
                        result.push({
                            value: `${property}[${loop.iterator}]~`,
                            type,
                            label: `${property} (${loop.iterator} loop)`,
                        });
                    }
                }
            }
        }
        if(isArray(fields[property])){
            type = FIELD_TYPE_ARRAY;
            result.push({
                value: `${property}[0]`,
                type,
                label: `${property} (1-st element of array)`,
            });
            if(connector !== null){
                const previousIterators = connector.getPreviousIterators();
                for(let i = 0; i < previousIterators.length; i++){
                    result.push({
                        value: `${property}[${previousIterators[i]}]`,
                        type,
                        label: `${property} (${previousIterators[i]} loop)`,
                    });

                }
            }
            result.push({
                value: `${property}${WHOLE_ARRAY}`,
                type,
                label: `${property} (the whole array)`,
            });
            return;
        }
        if (this._isAttributeProperty(property)) {
            property = ATTRIBUTES_MARK;
            type = FIELD_TYPE_STRING;
        }
        if (this._isValueProperty(property)) {
            return;
        }
        result.push({
            value: property,
            type,
            label: this._getLabel(type, property),
        });
    }

    _ifFoundAddProperty(result, fields, item, searchValue, connector = null){
        if (item.toLowerCase().includes(searchValue.toLowerCase())) {
            this._addFoundedProperty(result, fields, item, connector);
        }
    }

    _sortResultFields(fields){
        return fields.sort((field1, field2) => (field1.label > field2.label) ? 1 : ((field2.label > field1.label) ? -1 : 0));
    }

    _getLabel(type, label){
        switch(type){
            case FIELD_TYPE_ARRAY:
                return `${label}`;
            case FIELD_TYPE_OBJECT:
                return `${label} (Object)`;
        }
        return label;
    }

    _cleanSearchValue(searchValue){
        let result = searchValue;
        while(true) {
            let indexOfOpenBracket = result.indexOf('[');
            if(indexOfOpenBracket === -1){
                return result;
            } else{
                let indexOfCloseBracket = result.indexOf(']');
                if(indexOfCloseBracket === -1){
                    result = result.substr(0, indexOfOpenBracket);
                } else {
                    if(result.length > indexOfCloseBracket + 1) {
                        if (result[indexOfCloseBracket + 1] === '~') {
                            result = result.substr(0, indexOfOpenBracket + 1) + result.substr(indexOfCloseBracket + 1 + 1);
                        }
                    }
                    result = result.substr(0, indexOfOpenBracket) + result.substr(indexOfCloseBracket + 1);
                }
            }
        }
    }

    getFieldsForSelectSearch(searchValue, connector = null){
        let result = [];
        let cleanedSearchValue = this._cleanSearchValue(searchValue);
        let properties = cleanedSearchValue.split('.');
        let fields = isArray(this._fields) && this._fields.length > 0 ? this._fields[0] : this._fields;
        if(fields) {
            for (let i = 0; i < properties.length; i++) {
                let property = this._getProperty(properties[i]);
                let hasProperty = fields.hasOwnProperty(property);
                if (i < properties.length - 1) {
                    if (hasProperty) {
                        fields = this._getSubField(fields, property);
                        if(!fields){
                            return [];
                        }
                    } else {
                        return [];
                    }
                } else if (i === properties.length - 1) {
                    hasProperty = fields.hasOwnProperty(property);
                    if(hasProperty) {
                        if(this._isAttributeProperty(property)){
                            for (let item in fields[property]) {
                                if(fields[property].hasOwnProperty(item)) {
                                    result.push({
                                        value: `${ATTRIBUTES_MARK}${item}`,
                                        type: FIELD_TYPE_STRING,
                                        label: item
                                    });
                                }
                            }
                            return this._sortResultFields(result);
                        }
                        if(this._isValueProperty(property)){
                            return [];
                        }
                        this._addFoundedProperty(result, fields, property, connector);
                    } else {
                        for (let item in fields) {
                            this._ifFoundAddProperty(result, fields, item, property, connector);
                        }
                    }
                    /*
                    * the case when user wants to select the whole xml tag segment
                    * TODO: implement converter from invoker structure to xml string
                    *  depending on property and paste it in value
                    */
                    /*if(this._format === BODY_FORMAT.XML){
                        result.unshift({label: `<${properties[i]}/>`, value: `<xml/>`})
                    }*/
                }
            }
        }
        return this._sortResultFields(result);
    }

    /**
     * convert class to object
     * (difference between getObject method is even if fields are empty the method still returns some data
     * while getObject will return null)
     */
    convertToObject(){
        return {
            type: this._type,
            format: this._format,
            data: this._data,
            fields: isEmptyObject(this._fields) ? null : isArray(this._fields) ? this._fields[0] : this._fields,
        };
    }

    /**
     * get object of the class
     */
    getObject(){
        if(isEmptyObject(this._fields) || this._fields === null){
            return null;
        }
        return this.convertToObject();
    }
}
