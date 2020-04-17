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


import CCondition from "./CCondition";
import CStatement from "./CStatement";

export const IF_OPERATOR = 'if';
export const LOOP_OPERATOR = 'loop';

/**
 * (not used)
 */
export default class COperatorItem{

    constructor(index = '', type = '', condition = null, error = null, isMinimized = false, isToggled = false){
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._index = index;
        this._type = this.checkType(type) ? type : '';
        this._condition = CCondition.createCondition(condition);
        this._error = this.checkError(error);
        this._isMinimized = isMinimized;
        this._isToggled = isToggled;
    }

    static createOperatorItem(operatorItem){
        let index = operatorItem && operatorItem.hasOwnProperty('index') ? operatorItem.index : '';
        let type = operatorItem && operatorItem.hasOwnProperty('type') ? operatorItem.type : '';
        let condition = operatorItem && operatorItem.hasOwnProperty('condition') ? operatorItem.condition : null;
        let error = operatorItem && operatorItem.hasOwnProperty('error') ? operatorItem.error : null;
        let isMinimized = operatorItem && operatorItem.hasOwnProperty('isMinimized') ? operatorItem.isMinimized : false;
        let isToggled = operatorItem && operatorItem.hasOwnProperty('isToggled') ? operatorItem.isToggled : false;
        return new COperatorItem(index, type, condition, error, isMinimized, isToggled);
    }

    deleteError(){
        this._error = {
            hasError: false,
            location: '',
            message: '',
        };
    }

    checkType(type){
        return type === IF_OPERATOR || type === LOOP_OPERATOR;
    }

    checkError(error){
        if(error && error.hasOwnProperty('hasError') && error.hasOwnProperty('location')){
            return error;
        }
        return {
            hasError: false,
            location: '',
            message: '',
        };
    }

    getDepth(){
        let indexSplitted = this._index.split('_');
        let depth = indexSplitted.length;
        if(depth >= 1) {
            depth--;
        }
        return depth;
    }

    get uniqueIndex(){
        return this._uniqueIndex;
    }

    get index(){
        return this._index;
    }

    set index(index){
        this._index = index;
    }

    get type(){
        return this._type;
    }

    set type(type){
        this._type = this.checkType(type) ? type : '';
    }

    get condition(){
        return this._condition;
    }

    set condition(condition){
        this._condition = condition;
    }

    setLeftStatementColor(color){
        this._condition.leftStatement.color = color;
        this._condition.rightStatement.rightPropertyValue = '';
    }

    setLeftStatementField(field){
        this._condition.leftStatement.field = field;
        this._condition.rightStatement.rightPropertyValue = '';
    }

    setLeftStatementParent(parent){
        this._condition.leftStatement.parent = parent;
    }

    setLeftStatementResponseType(type){
        this._condition.leftStatement.responseType = type;
        this._condition.rightStatement.rightPropertyValue = '';
    }

    setRelationalOperator(relationalOperator){
        this._condition.relationalOperator = relationalOperator;
        this._condition.rightStatement = CStatement.createStatement();
    }

    getRelationalOperator(){
        return this._condition.relationalOperator;
    }

    setRightStatementColor(color){
        this._condition.rightStatement.color = color;
    }

    setRightStatementField(field){
        this._condition.rightStatement.field = field;
    }

    setRightStatementPropertyValue(rightPropertyValue){
        this._condition.rightStatement.rightPropertyValue = rightPropertyValue;
    }

    setRightStatementParent(parent){
        this._condition.rightStatement.parent = parent;
    }

    setRightStatementResponseType(type){
        this._condition.rightStatement.responseType = type;
    }

    get error(){
        return this._error;
    }

    set error(error){
        this._error = this.checkError(error);
    }

    get isMinimized(){
        return this._isMinimized;
    }

    set isMinimized(isMinimized){
        this._isMinimized = isMinimized;
    }

    get isToggled(){
        return this._isToggled;
    }

    set isToggled(isToggled){
        this._isToggled = isToggled;
    }

    getObject(){
        let obj = {
            index: this._index,
            type: this._type,
            condition: this._condition.getObject(),
        };
        return obj;
    }
}