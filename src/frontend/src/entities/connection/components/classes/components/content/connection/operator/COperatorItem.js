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

import CCondition, {FUNCTIONAL_OPERATORS_FOR_LOOP} from "./CCondition";
import CStatement, {DEFAULT_COLOR} from "./CStatement";
import {RESPONSE_SUCCESS} from "@classes/content/invoker/response/CResponse";

export const IF_OPERATOR = 'if';
export const LOOP_OPERATOR = 'loop';

/**
 * Operator Item class for Connector Item class
 */
export default class COperatorItem{

    constructor(index = '', type = '', condition = null, error = null, isMinimized = false, isToggled = false, iterator = '', dataAggregator = null){
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._index = index;
        this._type = this.checkType(type) ? type : '';
        this._condition = CCondition.createCondition(condition, this._type);
        this._error = this.checkError(error);
        this._isMinimized = isMinimized;
        this._isToggled = isToggled;
        this._intend = 0;
        this._isDisabled = false;
        this._iterator = iterator;
        this._dataAggregator = dataAggregator;
    }

    static createOperatorItem(operatorItem){
        let index = operatorItem && operatorItem.hasOwnProperty('index') ? operatorItem.index : '';
        let type = operatorItem && operatorItem.hasOwnProperty('type') ? operatorItem.type : '';
        let condition = operatorItem && operatorItem.hasOwnProperty('condition') ? operatorItem.condition : null;
        let error = operatorItem && operatorItem.hasOwnProperty('error') ? operatorItem.error : null;
        let isMinimized = operatorItem && operatorItem.hasOwnProperty('isMinimized') ? operatorItem.isMinimized : false;
        let isToggled = operatorItem && operatorItem.hasOwnProperty('isToggled') ? operatorItem.isToggled : false;
        let iterator = operatorItem && operatorItem.hasOwnProperty('iterator') ? operatorItem.iterator : '';
        let dataAggregator = operatorItem && operatorItem.hasOwnProperty('dataAggregator') ? operatorItem.dataAggregator : null;
        return new COperatorItem(index, type, condition, error, isMinimized, isToggled, iterator, dataAggregator);
    }

    cleanConditionFromReference(methodColor) {
        if(this.condition.leftStatement.color === methodColor) {
            this.condition.leftStatement.color = DEFAULT_COLOR;
            this.condition.relationalOperator = '';
            this.condition.rightStatement.color = DEFAULT_COLOR;
        }
        if(this.condition.rightStatement.color === methodColor) {
            this.condition.rightStatement.color = DEFAULT_COLOR;
        }
    }

    cleanFromReference(methodColor) {
        this.cleanConditionFromReference(methodColor);
    }

    static getOperatorTypesForSelect(){
        return [{label: 'if', value: IF_OPERATOR},{label: 'loop', value: LOOP_OPERATOR}];
    }

    deleteError(){
        this._error = {
            hasError: false,
            messages: [],
        };
    }

    checkType(type){
        return type === IF_OPERATOR || type === LOOP_OPERATOR;
    }

    checkError(error){
        if(error && error.hasOwnProperty('hasError')){
            return error;
        }
        return {
            hasError: false,
            messages: [],
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

    get dataAggregator(){
        return this._dataAggregator;
    }

    set dataAggregator(dataAggregator){
        this._dataAggregator = dataAggregator;
    }

    setStatementColorByType(type, color){
        switch(type){
            case 'leftStatement':
                this.setLeftStatementColor(color);
                break;
            case 'rightStatement':
                this.setRightStatementColor(color);
                break;
        }
    }

    setStatementFieldByType(type, field){
        switch(type){
            case 'leftStatement':
                this.setLeftStatementField(field);
                break;
            case 'rightStatement':
                this.setRightStatementField(field);
                break;
        }
    }

    setStatementParentByType(type, parent){
        switch(type){
            case 'leftStatement':
                this.setLeftStatementParent(parent);
                break;
            case 'rightStatement':
                this.setRightStatementParent(parent);
                break;
        }
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

    setLeftStatementRightPropertyValue(rightPropertyValue){
        this._condition.leftStatement.rightPropertyValue = rightPropertyValue;
    }

    setRelationalOperator(relationalOperator){
        this._condition.relationalOperator = relationalOperator;
        let field = '';
        if(CCondition.isLikeOperator(relationalOperator)){
            field = CCondition.embraceFieldForLikeOperator('');
        }
        this._condition.rightStatement = CStatement.createStatement({field});
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

    setRightStatementRightPropertyValue(rightPropertyValue){
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

    get intend(){
        return this._intend;
    }

    set intend(intend){
        this._intend = intend;
    }

    get isDisabled(){
        return this._isDisabled;
    }

    set isDisabled(isDisabled){
        this._isDisabled = isDisabled;
    }

    get iterator(){
        return this._iterator;
    }

    set iterator(iterator){
        this._iterator = iterator;
    }

    isAfter(item){
        if(!item) return false;
        let indexes = item.index.split('_');
        indexes.pop();
        let rootIndex = indexes.join('_');
        return this.index > item.index && this.index.substring(0, rootIndex.length) === rootIndex;
    }

    isSplitString() {
        return this.condition.relationalOperator === FUNCTIONAL_OPERATORS_FOR_LOOP[0].value;
    }

    getObject(){
        let obj = {
            index: this._index,
            type: this._type,
            condition: this._condition.getObject(),
            dataAggregator: this._dataAggregator?.id || this._dataAggregator,
        };
        if(this._iterator !== ''){
            obj.iterator = this._iterator;
        }
        return obj;
    }

    getObjectForConnectionOverview(){
        return {
            ...this.getObject(),
            error: this._error,
        }
    }
}
