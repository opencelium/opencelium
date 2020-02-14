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


import CCondition from "./CCondition";
import CStatement from "./CStatement";

export const IF_OPERATOR = 'if';
export const LOOP_OPERATOR = 'loop';

/**
 * (not used)
 */
export default class COperatorItem{

    constructor(index = '', type = '', condition = null){
        this._index = index;
        this._type = this.checkType(type) ? type : '';
        this._condition = CCondition.createCondition(condition);
    }

    static createOperatorItem(operatorItem){
        let index = operatorItem && operatorItem.hasOwnProperty('index') ? operatorItem.index : '';
        let type = operatorItem && operatorItem.hasOwnProperty('type') ? operatorItem.type : '';
        let condition = operatorItem && operatorItem.hasOwnProperty('condition') ? operatorItem.condition : null;
        return new COperatorItem(index, type, condition);
    }

    checkType(type){
        return type === IF_OPERATOR || type === LOOP_OPERATOR;
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

    getObject(){
        let obj = {
            index: this._index,
            type: this._type,
            condition: this._condition.getObject(),
        };
        return obj;
    }
}