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

import CStatement from "./CStatement";
import React from "react";
import {clearFieldNameFromArraySign} from "@change_component//form_elements/form_connection/form_methods/help";
import {consoleLog} from "@application/utils/utils";
import {LOOP_OPERATOR} from "@classes/content/connection/operator/COperatorItem";

const OPERATOR_LABELS_FOR_IF = {
    IS_TYPE_OF: (isPlaceholder = false) => {const styles = isPlaceholder ? {fontSize: '12px', justifyContent: 'center', display: 'flex'} : {fontSize: '12px'}; return (<span style={styles}>{`<T>`}</span>);},
    ALLOW_LIST: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>✔</span>);},
    DENY_LIST: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>⊗</span>);},
    PROPERTY_EXISTS: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>∃</span>);},
    PROPERTY_NOT_EXISTS: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>∄</span>);},
    CONTAINS: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>⊂</span>);},
    NOT_CONTAINS: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>⊄</span>);},
    CONTAINS_SUB_STR: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex', fontSize: '16px'} : {fontSize: '16px'}; return (<span style={styles}>⊂<span style={{fontSize: '9px'}}>a-z</span></span>);},
    NOT_CONTAINS_SUB_STR: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex', fontSize: '16px'} : {fontSize: '16px'}; return (<span style={styles}>⊄<span style={{fontSize: '9px'}}>a-z</span></span>);},
    REG_EXP: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{".*"}</span>);},
    LIKE: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{"≈"}</span>);},
    NOT_LIKE: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{"≉"}</span>);},
    MORE_EQUAL: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{">="}</span>);},
    MORE: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{">"}</span>);},
    LESS_EQUAL: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{"<="}</span>);},
    LESS: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{"<"}</span>);},
    EQUAL: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{"="}</span>);},
    NOT_EQUAL: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{"≠"}</span>);},
}

const OPERATOR_LABELS_FOR_LOOP = {
    SPLIT_STRING: (isPlaceholder = false) => {const styles = isPlaceholder ? {justifyContent: 'center', display: 'flex'} : {}; return (<span style={styles}>{"÷ String"}</span>);},
}

//value - operator name for backend
//hasValue = false -> the right statement is absent (default: true)
//isRightStatementText = true -> the right statement is only text(constant) (default: false)
//hasThreeValues = true -> the rightPropertyValue has a value
//placeholderValue - placeholder of the selected operator (short view)
export const FUNCTIONAL_OPERATORS_FOR_IF = [
    {value: 'IsNull', hasValue: false},
    {value: 'AllowList',isMultiline:true,label: <span>AllowList({OPERATOR_LABELS_FOR_IF.ALLOW_LIST()})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS_FOR_IF.ALLOW_LIST(true)},
    {value: 'DenyList',isMultiline:true,label: <span>DenyList({OPERATOR_LABELS_FOR_IF.DENY_LIST()})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS_FOR_IF.DENY_LIST(true)},
    {value: 'IsTypeOf',label: <span>IsTypeOf({OPERATOR_LABELS_FOR_IF.IS_TYPE_OF()})</span>, hasValue: true, isRightStatementOption: true, options: [{value: 'NUM', label: 'Number'}, {value: 'ARR', label: 'Array'}, {value: 'OBJ', label: 'Object'}, {value: 'STR', label: 'String'}, {value: 'BOOL', label: 'Boolean'}], placeholderValue: OPERATOR_LABELS_FOR_IF.IS_TYPE_OF(true)},
    {value: 'PropertyExists',label: <span>PropertyExists({OPERATOR_LABELS_FOR_IF.PROPERTY_EXISTS()})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS_FOR_IF.PROPERTY_EXISTS(true)},
    {value: 'PropertyNotExists',label: <span>PropertyNotExists({OPERATOR_LABELS_FOR_IF.PROPERTY_NOT_EXISTS()})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS_FOR_IF.PROPERTY_NOT_EXISTS(true)},
    {value: 'Contains', label: <span>Contains({OPERATOR_LABELS_FOR_IF.CONTAINS()})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS_FOR_IF.CONTAINS(true)},
    {value: 'NotContains', label: <span>NotContains({OPERATOR_LABELS_FOR_IF.NOT_CONTAINS()})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS_FOR_IF.NOT_CONTAINS(true)},
    {value: 'ContainsSubStr', label: <span>ContainsSubStr({OPERATOR_LABELS_FOR_IF.CONTAINS_SUB_STR()})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS_FOR_IF.CONTAINS_SUB_STR(true)},
    {value: 'NotContainsSubStr', label: <span>NotContainsSubStr({OPERATOR_LABELS_FOR_IF.NOT_CONTAINS_SUB_STR()})</span>, hasValue: true, hasThreeValues: true, placeholderValue: OPERATOR_LABELS_FOR_IF.NOT_CONTAINS_SUB_STR(true)},
    {value: 'RegExp', label: <span>RegExp({OPERATOR_LABELS_FOR_IF.REG_EXP})</span>, hasValue: true, isRightStatementText: true, placeholderValue: OPERATOR_LABELS_FOR_IF.REG_EXP(true),},
    {value: 'Like', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.LIKE(true)},
    {value: 'NotLike', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.NOT_LIKE(true)},
    {value: '>=', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.MORE_EQUAL(true)},
    {value: '>', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.MORE(true)},
    {value: '<=', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.LESS_EQUAL(true)},
    {value: '<', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.LESS(true)},
    {value: '=', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.EQUAL(true)},
    {value: '!=', hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_IF.NOT_EQUAL(true)},
    {value: 'NotNull', hasValue: false},
    {value: 'IsEmpty', hasValue: false},
    {value: 'NotEmpty', hasValue: false}
];
export const FUNCTIONAL_OPERATORS_FOR_LOOP = [
    {value: 'SplitString', label: <span>SplitString({OPERATOR_LABELS_FOR_LOOP.SPLIT_STRING()})</span>, hasValue: true, placeholderValue: OPERATOR_LABELS_FOR_LOOP.SPLIT_STRING(true)}
];

/**
 * Condition class for Operator Item class
 */
export default class CCondition{

    constructor(leftStatement = null, relationalOperator = '', rightStatement = null, operatorType = ''){
        this._operatorType = operatorType;
        this._leftStatement = CStatement.createStatement(leftStatement);
        this._relationalOperator = this.checkRelationalOperator(relationalOperator) ? relationalOperator : '';
        this._rightStatement = CStatement.createStatement(rightStatement);
    }

    static createCondition(condition, operatorType){
        let leftStatement = condition && condition.hasOwnProperty('leftStatement') ? condition.leftStatement : null;
        let relationalOperator = condition && condition.hasOwnProperty('relationalOperator') ? condition.relationalOperator : '';
        let rightStatement = condition && condition.hasOwnProperty('rightStatement') ? condition.rightStatement : null;
        return new CCondition(leftStatement, relationalOperator, rightStatement, operatorType);
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
        if(this._operatorType === LOOP_OPERATOR){
            if(this.leftStatement && this.leftStatement.field !== '') {
                statement = !isOnlyText ? (
                    <span>
                        <span>{`For each element of the `}</span>
                        {this.relationalOperator === 'SplitString' ? <span>{`split `}</span> : ''}
                        <b>{clearFieldNameFromArraySign(this.leftStatement.field)}</b>
                    </span>
                ) : `For each element of the ${this.relationalOperator === 'SplitString' ? `split` : ''} ${clearFieldNameFromArraySign(this.leftStatement.field)}`;
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
            const isLikeOperator = CCondition.isLikeOperator(this.relationalOperator);
            if(isLikeOperator){
                if(rightStatementText[rightStatementText.length - 1] === '}'){
                    rightStatementText = rightStatementText.slice(0, rightStatementText.length - 1);
                } else{
                    rightStatementText = `${rightStatementText.slice(0, rightStatementText.length - 2)}${rightStatementText[rightStatementText.length - 1]}`;
                }
                if(rightStatementText[0] === '{'){
                    rightStatementText = rightStatementText.slice(1);
                } else{
                    rightStatementText = `${rightStatementText[0]}${rightStatementText.slice(2)}`;
                }
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
        const options = this._operatorType === LOOP_OPERATOR ? FUNCTIONAL_OPERATORS_FOR_LOOP : FUNCTIONAL_OPERATORS_FOR_IF;
        return options.findIndex(fo => fo.value === relationalOperator) !== -1;
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

    get operatorType(){
        return this._operatorType;
    }

    set operatorType(operatorType){
        this._operatorType = operatorType;
    }

    static embraceFieldForLikeOperator(fieldValue){
        return `{${fieldValue}}`;
    }

    static isLikeOperator(relationalOperator){
        return relationalOperator === 'Like' || relationalOperator === 'NotLike';
    }

    static excludeFieldFromLikeOperator(fieldValue){
        if(fieldValue[0] === '{' && fieldValue[fieldValue.length - 1] === '}'){
            return fieldValue.substr(1, fieldValue.length - 2);
        }
        return fieldValue;
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