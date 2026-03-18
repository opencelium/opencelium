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

import {isNumber, isString} from "@application/utils/utils";
import {RESPONSE_FAIL, RESPONSE_SUCCESS} from "../../invoker/response/CResponse";
import {ARRAY_SIGN} from "@entity/connection/components/classes/components/content/invoker/response/CResponseResult";
import {markFieldNameAsArray} from "@change_component//form_elements/form_connection/form_methods/help";
import {putAsterixInEmptyBrackets} from "@change_component/form_elements/form_connection/form_svg/utils";
import CCondition from "@classes/content/connection/operator/CCondition";
import CSuccess from "@classes/content/invoker/response/CSuccess";
import CFail from "@classes/content/invoker/response/CFail";

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
        this._field = putAsterixInEmptyBrackets(field);
        this._type = this.checkType(type) ? type : STATEMENT_RESPONSE;
        this._parent = parent;
        this._rightPropertyValue = rightPropertyValue;
    }

    static createStatement(statement = null){
        let color = statement && statement.hasOwnProperty('color') && statement.color ? statement.color : '';
        let field = statement && statement.hasOwnProperty('field') ? statement.field : '';
        let rightPropertyValue = statement && statement.hasOwnProperty('rightPropertyValue') && statement.rightPropertyValue ? statement.rightPropertyValue : '';
        const parent = statement && statement.hasOwnProperty('parent') ? statement.parent : null;
        const type = statement && statement.hasOwnProperty('type') && statement.type ? statement.type : '';

        if (isNumber(field)) {
            field = `${field}`;
        }

        let responseType = '';
        if (field !== '') {
            const fieldSplitted = field.split('.');
            if (fieldSplitted.length > 0) {
                const firstPart = fieldSplitted[0];
                if (firstPart === RESPONSE_SUCCESS || firstPart === RESPONSE_FAIL) {
                    responseType = firstPart;
                    fieldSplitted.splice(0, 1);
                    field = fieldSplitted.join('.');
                }
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

    setOnlyColor(color){
        this._color = this.checkColor(color) ? color : DEFAULT_COLOR;
    }

    set color(color){
        this._color = this.checkColor(color) ? color : DEFAULT_COLOR;
        this._field = '';
        this._responseType = RESPONSE_SUCCESS;
        this._rightPropertyValue = '';
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

    isNotElementWithIndex(value){
        if(isString(value) && value.length > 1){
            return value[0] !== '[' && value[value.length - 1] !== ']';
        }
        return true;
    }

    getObject(){
        const color = this._color;
        const parent = this._parent;
        let field = this._field;
        const rightPropertyValue = this._rightPropertyValue;

        if ((color === DEFAULT_COLOR || color === '') && field === '') {
            if (parent instanceof CCondition) {
                return {
                    color: '',
                    field: '',
                    type: '',
                };
            }
            return null;
        }

        if ((parent instanceof CSuccess || parent instanceof CFail) && typeof parent !== 'undefined') {
            const fieldSplit = field.split('.');
            let tmpField = '';
            let newField = '';

            for (let i = 0; i < fieldSplit.length; i++) {
                let fieldSplitValue = fieldSplit[i];
                tmpField += tmpField !== '' ? `.${fieldSplitValue}` : fieldSplitValue;

                const findField = parent.getFields(tmpField).find(f => f.value === fieldSplitValue);
                if (findField && this.isNotElementWithIndex(findField.value) && findField.type === 'array') {
                    fieldSplitValue = markFieldNameAsArray(fieldSplitValue);
                }

                newField += newField !== '' ? `.${fieldSplitValue}` : `${fieldSplitValue}`;
            }

            field = newField;
        }

        if (color === DEFAULT_COLOR) {
            if (field !== ' ' && isNumber(field)) {
                field = parseInt(field);
            }

            return {
                color: '',
                field: field !== '""' ? field : '',
                rightPropertyValue: rightPropertyValue !== '""' ? rightPropertyValue : '',
                type: '',
            };
        }

        return {
            color,
            field: field ? `${this._responseType}.${field}` : this._responseType,
            type: this._type,
            rightPropertyValue,
        };
    }
}
