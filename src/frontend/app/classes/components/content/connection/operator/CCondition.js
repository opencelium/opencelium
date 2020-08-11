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


import CStatement from "./CStatement";

export const FUNCTIONAL_OPERATORS = [
    {value: 'IsNull', hasValue: false},
    {value: 'Contains', label: 'Contains(⊂)', hasValue: true},
    {value: 'NotContains', label: 'NotContains(⊄)', hasValue: true},
    {value: '>=', hasValue: true},
    {value: '>', hasValue: true},
    {value: '<=', hasValue: true},
    {value: '<', hasValue: true},
    {value: '=', hasValue: true},
    {value: '!=', hasValue: true},
    {value: 'NotNull', hasValue: false},
    {value: 'IsEmpty', hasValue: false},
    {value: 'NotEmpty', hasValue: false},
];

/**
 * Condition class for Operator Item class
 */
export default class CCondition{

    constructor(leftStatement = null, relationalOperator = '', rightStatement = null){
        this._leftStatement = CStatement.createStatement(leftStatement);
        this._relationalOperator = this.checkRelationalOperator(relationalOperator) ? relationalOperator : '';
        this._rightStatement = CStatement.createStatement(rightStatement);
    }

    static createCondition(condition){
        let leftStatement = condition && condition.hasOwnProperty('leftStatement') ? condition.leftStatement : null;
        let relationalOperator = condition && condition.hasOwnProperty('relationalOperator') ? condition.relationalOperator : '';
        let rightStatement = condition && condition.hasOwnProperty('rightStatement') ? condition.rightStatement : null;
        return new CCondition(leftStatement, relationalOperator, rightStatement);
    }

    checkRelationalOperator(relationalOperator){
        return FUNCTIONAL_OPERATORS.findIndex(fo => fo.value === relationalOperator) !== -1;
    }

    get leftStatement(){
        return this._leftStatement;
    }

    set leftStatement(leftStatement){
        this._leftStatement = leftStatement;
    }

    get relationalOperator(){
        return this._relationalOperator;
    }

    set relationalOperator(relationalOperator){
        this._relationalOperator = this.checkRelationalOperator(relationalOperator) ? relationalOperator : '';
    }

    get rightStatement(){
        return this._rightStatement;
    }

    set rightStatement(rightStatement){
        this._rightStatement = rightStatement;
    }

    getObject(){
        let obj = {
            leftStatement: this._leftStatement.getObject(),
            relationalOperator: this._relationalOperator,
            rightStatement: this._rightStatement.getObject(),
        };
        return obj;
    }
}