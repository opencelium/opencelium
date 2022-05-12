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

import CStatement from "./CStatement";
import React from "react";
import {clearFieldNameFromArraySign} from "@change_component//form_elements/form_connection/form_methods/help";
import {consoleLog} from "@application/utils/utils";

const OPERATOR_LABELS = {
    IS_TYPE_OF: <span style={{fontSize: '12px'}}>{`<T>`}</span>,
    ALLOW_LIST: <span>✔</span>,
    DENY_LIST: <span>⊗</span>,
    PROPERTY_EXISTS: <span>∃</span>,
    PROPERTY_NOT_EXISTS: <span>∄</span>,
    CONTAINS: <span>⊂</span>,
    NOT_CONTAINS: <span>⊄</span>,
    CONTAINS_SUB_STR: <span style={{fontSize: '16px'}}>⊂<span style={{fontSize: '9px'}}>a-z</span></span>,
    NOT_CONTAINS_SUB_STR: <span style={{fontSize: '16px'}}>⊄<span style={{fontSize: '9px'}}>a-z</span></span>,
}

//value - operator name for backend
//hasValue = false -> the right statement is absent (default: true)
//isRightStatementText = true -> the right statement is only text(constant) (default: false)
//hasThreeValues = true -> the rightPropertyValue has a value
//placeholderValue - placeholder of the selected operator (short view)
export const FUNCTIONAL_OPERATORS = [
    {value: 'IsNull', hasValue: false},
    {value: 'AllowList',isMultiline:true,label: <span>AllowList({OPERATOR_LABELS.ALLOW_LIST})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS.ALLOW_LIST},
    {value: 'DenyList',isMultiline:true,label: <span>DenyList({OPERATOR_LABELS.DENY_LIST})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS.DENY_LIST},
    {value: 'IsTypeOf',label: <span>IsTypeOf({OPERATOR_LABELS.IS_TYPE_OF})</span>, hasValue: true, isRightStatementOption: true, options: [{value: 'NUM', label: 'Number'}, {value: 'ARR', label: 'Array'}, {value: 'OBJ', label: 'Object'}, {value: 'STR', label: 'String'}, {value: 'BOOL', label: 'Boolean'}], placeholderValue: OPERATOR_LABELS.IS_TYPE_OF},
    {value: 'PropertyExists',label: <span>PropertyExists({OPERATOR_LABELS.PROPERTY_EXISTS})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS.PROPERTY_EXISTS},
    {value: 'PropertyNotExists',label: <span>PropertyNotExists({OPERATOR_LABELS.PROPERTY_NOT_EXISTS})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS.PROPERTY_NOT_EXISTS},
    {value: 'Contains', label: <span>Contains({OPERATOR_LABELS.CONTAINS})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS.CONTAINS},
    {value: 'NotContains', label: <span>NotContains({OPERATOR_LABELS.NOT_CONTAINS})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS.NOT_CONTAINS},
    {value: 'ContainsSubStr', label: <span>ContainsSubStr({OPERATOR_LABELS.CONTAINS_SUB_STR})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS.CONTAINS_SUB_STR},
    {value: 'NotContainsSubStr', label: <span>NotContainsSubStr({OPERATOR_LABELS.NOT_CONTAINS_SUB_STR})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS.NOT_CONTAINS_SUB_STR},
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

    getStatementByType(type){
        switch(type){
            case 'leftStatement':
                return this._leftStatement;
            case 'rightStatement':
                return this._rightStatement;
        }
        consoleLog('CCondition. getStatementByType. Type is incorrect ' + type);
        return null;
    }

    generateStatementText(isOnlyText = false){
        let statement = '';
        if(this.relationalOperator === ''){
            if(this.leftStatement && this.leftStatement.field !== '') {
                statement = !isOnlyText ? (
                    <span>
                        <span>{`For each element of the `}</span>
                        <b>{clearFieldNameFromArraySign(this.leftStatement.field)}</b>
                    </span>
                ) : `For each element of the ${clearFieldNameFromArraySign(this.leftStatement.field)}`;
            }
        } else {
            let leftStatementText = '';
            if (this.leftStatement && this.leftStatement.field !== '') {
                leftStatementText = this.leftStatement.field;
            }
            let rightStatementText = '';
            if (this.rightStatement && this.rightStatement.field !== '') {
                rightStatementText = this.rightStatement.field;
            }
            if(leftStatementText !== '') {
                statement = !isOnlyText ? (
                    <span>
                        {`If `}
                        <b>{clearFieldNameFromArraySign(leftStatementText)}</b>
                        <span>{` ${this.relationalOperator} `}</span>
                        <b>{clearFieldNameFromArraySign(rightStatementText)}</b>
                    </span>
                ) : `If ${clearFieldNameFromArraySign(leftStatementText)} ${this.relationalOperator} ${clearFieldNameFromArraySign(rightStatementText)}`;
            }
        }
        if(statement === ''){
            statement = 'Some data is missing';
        }
        return statement;
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