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

import {consoleLog, isNumber, isString} from "@utils/app";
import {RESPONSE_FAIL, RESPONSE_SUCCESS} from "../../invoker/response/CResponse";
import {ARRAY_SIGN, WHOLE_ARRAY} from "@classes/components/content/invoker/response/CResponseResult";
import {markFieldNameAsArray} from "@change_component/form_elements/form_connection/form_methods/help";

export const STATEMENT_REQUEST = 'request';
export const STATEMENT_RESPONSE = 'response';
export const STATEMENT_STATIC = 'static';
export const DEFAULT_COLOR = '#ffffff';

/**
 * Statement class for Condition class
 */
export default class CStatement{

    constructor(color = '', responseType = RESPONSE_SUCCESS, field = '', type = STATEMENT_RESPONSE, parent = null, rightPropertyValue = ''){
        this._color = this.checkColor(color) ? color : DEFAULT_COLOR;
        this._responseType = this.checkResponseType(responseType) ? responseType : RESPONSE_SUCCESS;
        this._field = field;
        this._type = this.checkType(type) ? type : STATEMENT_RESPONSE;
        this._parent = parent;
        this._rightPropertyValue = rightPropertyValue;
    }

    static createStatement(statement = null){
        let color = statement && statement.hasOwnProperty('color') && statement.color ? statement.color : '';
        let field = statement && statement.hasOwnProperty('field') && statement.field ? statement.field : '';
        let rightPropertyValue = statement && statement.hasOwnProperty('rightPropertyValue') && statement.rightPropertyValue ? statement.rightPropertyValue : '';
        let parent = statement && statement.hasOwnProperty('parent') ? statement.parent : null;
        let type = statement && statement.hasOwnProperty('type') && statement.type ? statement.type : '';
        if(isNumber(field)){
            field = `${field}`;
        }
        let fieldSplitted = field !== '' ? field.split('.') : [];
        let responseType = '';
        if(fieldSplitted.length > 0){
            responseType = fieldSplitted[0] === RESPONSE_SUCCESS || fieldSplitted[0] === RESPONSE_FAIL ? fieldSplitted[0] : '';
            if(responseType !== ''){
                fieldSplitted.splice(0, 1);
                field = fieldSplitted.join('.');
            }
        }
        return new CStatement(color, responseType, field, type, parent, rightPropertyValue);
    }

    getFieldWithoutArrayBrackets(){
        return this._field.replace(ARRAY_SIGN, '');
    }

    getRightPropertyValueWithoutArrayBrackets(){
        return this._rightPropertyValue.replace(ARRAY_SIGN, '');
    }

    checkType(type){
        return type === STATEMENT_REQUEST || type === STATEMENT_RESPONSE || type === STATEMENT_STATIC;
    }

    checkResponseType(responseType){
        return responseType === RESPONSE_SUCCESS || responseType === RESPONSE_FAIL;
    }

    checkColor(color){
        return isString(color) && color[0] === '#' && color.length === 7;
    }

    get color(){
        return this._color;
    }

    set color(color){
        this._color = this.checkColor(color) ? color : DEFAULT_COLOR;
        this._field = '';
        this._responseType = RESPONSE_SUCCESS;
    }

    get responseType(){
        return this._responseType;
    }

    set responseType(responseType){
        if(this.checkResponseType(responseType)) {
            this._responseType = responseType;
            this._field = '';
        }
    }

    get field(){
        return this._field;
    }

    set field(field){
        this._field = field;
    }

    get type(){
        return this._type;
    }

    set type(type){
        if(this.checkType(type)) {
            this._type = type;
        }
    }

    set parent(parent){
        this._parent = parent;
    }

    get rightPropertyValue(){
        return this._rightPropertyValue;
    }

    set rightPropertyValue(rightPropertyValue){
        this._rightPropertyValue = rightPropertyValue;
    }

    getObject(){
        if((this._color === DEFAULT_COLOR || this._color === '') && this.field === ''){             //for one statement operator
            return null;
        } else {
            let field = this._field;
            if(this._parent !== null && typeof this._parent !== 'undefined'){
                let fieldSplit = field.split('.');
                let tmpField = '';
                let newField = '';
                for(let i = 0; i < fieldSplit.length; i++){
                    let fieldSplitValue = fieldSplit[i];
                    tmpField += tmpField !== '' ? `.${fieldSplitValue}` : fieldSplitValue;
                    let findField = this._parent.getFields(tmpField).find(f => f.value === fieldSplitValue);
                    if(findField && findField.value !== WHOLE_ARRAY && findField.type === 'array'){
                        fieldSplitValue = markFieldNameAsArray(fieldSplitValue);
                    }
                    newField += newField !== '' ? `.${fieldSplitValue}` : `${fieldSplitValue}`;
                }
                field = newField;
            }
            if(this._color === DEFAULT_COLOR){         //for static values
                if(isNumber(field)){
                    field = parseInt(field);
                }
                return {
                    color: '',
                    field: field !== '""' ? field : '',
                    rightPropertyValue: this._rightPropertyValue !== '""' ? this._rightPropertyValue : '',
                    type: '',
                };
            } else {
                return {
                    color: this._color,
                    field: field ? `${this._responseType}.${field}` : this._responseType,
                    type: this._type,
                    rightPropertyValue: this._rightPropertyValue,
                };
            }
        }
    }
}