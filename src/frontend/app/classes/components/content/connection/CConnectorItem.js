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

import {consoleLog, isId, sortByIndex, subArrayToString} from "../../../../utils/app";
import CMethodItem from "./method/CMethodItem";
import COperatorItem from "./operator/COperatorItem";
import CInvoker from "../invoker/CInvoker";

export const INSIDE_ITEM = 'in';
export const OUTSIDE_ITEM = 'out';
const REFACTOR_ADD = 'add';
const REFACTOR_REMOVE = 'delete';
export const CONNECTOR_FROM = 'fromConnector';
export const CONNECTOR_TO = 'toConnector';
export const METHOD_ITEM = 'method';
export const OPERATOR_ITEM = 'operator';

export const CONNECTOR_DEPTH_LIMIT = 7;

/**
 * Connector class for manipulating data in the Connector Component
 * also it is a part of Connection Component
 */
export default class CConnectorItem{

    constructor(connectorId = 0, title = '', invoker = null, methods = [], operators = [], connectorType = ''){
        this._id = isId(connectorId) ? connectorId : 0;
        this._title = title === '' ? 'Please, choose connector' : title;
        this._invoker = this.convertInvoker(invoker);
        this._currentItem = null;
        this._connectorType = this.checkConnectorType(connectorType) ? connectorType : '';
        this._methods = this.convertMethods(methods);
        this._operators = this.convertOperators(operators);
    }

    static createConnectorItem(connectorItem){
        let connectorId = connectorItem && connectorItem.hasOwnProperty('connectorId') ? connectorItem.connectorId : 0;
        let title = connectorItem && connectorItem.hasOwnProperty('title') ? connectorItem.title : '';
        let invoker = connectorItem && connectorItem.hasOwnProperty('invoker') ? connectorItem.invoker : null;
        let methods = connectorItem && connectorItem.hasOwnProperty('methods') ? connectorItem.methods : [];
        let operators = connectorItem && connectorItem.hasOwnProperty('operators') ? connectorItem.operators : [];
        let connectorType = connectorItem && connectorItem.hasOwnProperty('connectorType') ? connectorItem.connectorType : '';
        return new CConnectorItem(connectorId, title, invoker, methods, operators, connectorType);
    }

    convertItem(itemType, item){
        switch(itemType){
            case METHOD_ITEM:
                return this.convertMethod(item);
            case OPERATOR_ITEM:
                return this.convertOperator(item);
        }
    }

    convertInvoker(invoker){
        if(!(invoker instanceof CInvoker)) {
            return CInvoker.createInvoker(Object.assign({}, invoker));
        }
        return invoker;
    }

    checkConnectorType(connectorType){
        return connectorType === CONNECTOR_FROM || connectorType === CONNECTOR_TO;
    }

    resetItems(){
        this._methods = [];
        this._operators = [];
        this._currentItem = null;
    }

    convertMethod(method){
        if(!(method instanceof CMethodItem)) {
            return CMethodItem.createMethodItem({...method, invoker: this._invoker});
        }
        return method;
    }

    convertMethods(methods){
        let result = [];
        for(let i = 0; i < methods.length; i++){
            result.push(this.convertMethod(methods[i]));
        }
        result = sortByIndex(result);
        return result;
    }

    convertOperator(operator){
        if(!(operator instanceof COperatorItem)) {
            return COperatorItem.createOperatorItem(operator);
        }
        return operator;
    }

    convertOperators(operators){
        let result = [];
        for(let i = 0; i < operators.length; i++){
            result.push(this.convertOperator(operators[i]));
        }
        result = sortByIndex(result);
        return result;
    }

    updateInvokerForMethods(){
        for(let i = 0; i < this._methods.length; i++){
            this._methods[i].invoker = this._invoker;
        }
    }

    toggleItems(itemType, item, value){
        let items = [];
        switch (itemType) {
            case METHOD_ITEM:
                items = this.methods;
                break;
            case OPERATOR_ITEM:
                items = this.operators;
                break;
        }
        for(let i = 0; i < items.length; i++){
            if(items[i].index !== item.index && items[i].index.indexOf(item.index) === 0){
                items[i].isToggled = value;
                if(itemType === OPERATOR_ITEM){
                    items[i].isMinimized = value;
                }
            }
            if(itemType === OPERATOR_ITEM && items[i].index === item.index){
                items[i].isMinimized = value;
            }
        }
    }

    toggleByItem(item, value){
        this.toggleItems(METHOD_ITEM, item, value);
        this.toggleItems(OPERATOR_ITEM, item, value);
    }

    hasItemChildren(item){
        let result = false;
        result = this.methods.findIndex(m => m.index !== item.index && m.index.indexOf(item.index) === 0) !== -1;
        return result || this.operators.findIndex(o => o.index !== item.index && o.index.indexOf(item.index) === 0) !== -1;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`ConnectorItem has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    set id(id){
        if(isId(id)) {
            this._id = id;
        }
    }

    get title(){
        return this._title;
    }

    set title(title){
        this._title = title;
    }

    get invoker(){
        return this._invoker;
    }

    set invoker(invoker){
        this._invoker = this.convertInvoker(invoker);
        this.updateInvokerForMethods();
    }

    get methods(){
        return this._methods;
    }

    set methods(methods){
        this._methods = this.convertMethods(methods);
    }

    get operators(){
        return this._operators;
    }

    set operators(operators){
        this._operators = this.convertOperators(operators);
    }

    getCurrentItem(){
        if(this._currentItem === null){
            if(this._methods.length !== 0){
                this._currentItem = this._methods[this._methods.length - 1];
            }
        }
        return this._currentItem;
    }

    setCurrentItem(item){
        this._currentItem = item;
    }

    refactorIndex(item, refactorMode, index){
        let indexes = item.index.split('_');
        let length = indexes.length;
        if(length >= 1){
            switch(refactorMode){
                case REFACTOR_ADD:
                    indexes[index] = parseInt(indexes[index]) + 1;
                    break;
                case REFACTOR_REMOVE:
                    if(parseInt(indexes[index]) > 0) {
                        indexes[index] = parseInt(indexes[index]) - 1;
                    } else if(parseInt(indexes[index]) === 0){
                        if(index > 0) {
                            indexes[index - 1] = parseInt(indexes[index - 1]) - 1;
                        }
                    }
                    break;
            }
        }
        item.index = indexes.join('_');
    }

    shouldStartRefactorIndex(item, newIndex){
        let itemIndex = item.index;
        let itemIndexSplitted = itemIndex.split('_');
        let newIndexSplitted = newIndex.split('_');
        let result = {result: false, index: 0};
        if(newIndexSplitted.length === 1){
            if(parseInt(itemIndexSplitted[0]) >= parseInt(newIndexSplitted[0])){
                result.result = true;
                result.index = 0;
            }
        } else {
            for(let i = 0; i < newIndexSplitted.length; i++){
                if(i < itemIndexSplitted.length) {
                    if (parseInt(newIndexSplitted[i]) < parseInt(itemIndexSplitted[i])
                        && itemIndexSplitted.length >= newIndexSplitted.length
                    ) {
                        if(itemIndex.indexOf(subArrayToString(newIndexSplitted, '_', 0, newIndexSplitted.length - 1)) === 0){
                            result.result = true;
                            result.index = i;
                        }
                        break;
                    }
                    if (parseInt(newIndexSplitted[i]) > parseInt(itemIndexSplitted[i])) {
                        break;
                    }
                    if (i === newIndexSplitted.length - 1) {
                        result.result = true;
                        result.index = i;
                    }
                } else{
                    break;
                }
            }
        }
        return result;
    }

    refactorIndexes(index, refactorMode = REFACTOR_ADD, itemType, originalIndex){
        let doRefactorData = {result: false, index: 0};
        for(let i = 0; i < this.methods.length; i++){
            doRefactorData = this.shouldStartRefactorIndex(this.methods[i], itemType === 'operator' ? originalIndex : index);
            if (doRefactorData.result) {
                this.refactorIndex(this.methods[i], refactorMode, doRefactorData.index);
            }
        }
        doRefactorData = {result: false, index: 0};
        for(let i = 0; i < this.operators.length; i++) {
            doRefactorData = this.shouldStartRefactorIndex(this.operators[i], itemType === 'method' ? originalIndex : index);
            if (doRefactorData.result) {
                this.refactorIndex(this.operators[i], refactorMode, doRefactorData.index);
            }
        }
    }

    findPrevItemIndex(itemType = '', index, mode = OUTSIDE_ITEM){
        if(index === ''){
            return '0';
        }
        let items = [];
        switch(itemType){
            case METHOD_ITEM:
                items = this._methods;
                if(mode === INSIDE_ITEM){
                    let insideItemIndex = items.findIndex(item => item.index === `${index}_0`);
                    if(insideItemIndex !== -1){
                        return insideItemIndex - 1;
                    } else{
                        insideItemIndex = this._operators.findIndex(item => item.index === `${index}_0`);
                        if(insideItemIndex !== -1){
                            for (let i = 0; i < items.length; i++) {
                                if (items[i].index.indexOf(`${index}_`) === 0) {
                                    return i - 1;
                                }
                            }
                        }
                    }
                }
                break;
            case OPERATOR_ITEM:
                items = this._operators;
                if(mode === INSIDE_ITEM){
                    let insideItemIndex = items.findIndex(item => item.index === `${index}_0`);
                    if(insideItemIndex !== -1){
                        return insideItemIndex - 1;
                    } else{
                        insideItemIndex = this._methods.findIndex(item => item.index === `${index}_0`);
                        if(insideItemIndex !== -1){
                            for (let i = 0; i < items.length; i++) {
                                if (items[i].index.indexOf(`${index}_`) === 0) {
                                    return i - 1;
                                }
                            }
                        }
                    }
                }
                break;
        }
        let indexSplitter = index.split('_');
        let prevIndex = -1;
        let shouldStop = false;
        for(let i = indexSplitter.length - 1; i >= 0; i--){
            for(let j = parseInt(indexSplitter[i]); j >= 0; j--){
                let tmpIndex = i > 0 ? `${subArrayToString(indexSplitter, '_', 0, i)}_${j}` : j;
                let findIndex = -1;
                for (let k = items.length - 1; k >= 0; k--) {
                    if (items[k].index.indexOf(tmpIndex) === 0) {
                        findIndex = k;
                        break;
                    }
                }
                if(findIndex !== -1){
                    prevIndex = findIndex;
                    shouldStop = true;
                    break;
                }
            }
            if(shouldStop){
                break;
            }
        }
        return prevIndex;
    }

    checkIfTheSpliceIndexCorrect(itemType, key, newItem){
        if(key >= 0) {
            let keySplit = itemType === METHOD_ITEM ? this._methods[key].index.split('_') : this._operators[key].index.split('_');
            let newItemIndexSplit = newItem.index.split('_');
            let maxIndex = keySplit.length > newItemIndexSplit.length ? keySplit : newItemIndexSplit;
            for (let i = 0; i < maxIndex.length; i++) {
                if (parseInt(newItemIndexSplit[i]) < parseInt(keySplit[i])) {
                    return false;
                }
                if (parseInt(newItemIndexSplit[i]) > parseInt(keySplit[i])) {
                    return true;
                }
            }
        }
        return true;
    }

    addItem(itemType, item, mode = OUTSIDE_ITEM){
        let newItem = this.convertItem(itemType, item);
        let currentIndex = this._currentItem ? this._currentItem.index : '';
        let nextIndex = this.generateNextIndex(mode);
        newItem.index = nextIndex;
        let key = this.findPrevItemIndex(itemType, currentIndex, mode);
        this.refactorIndexes(nextIndex, REFACTOR_ADD);
        switch(itemType){
            case METHOD_ITEM:
                if (this._methods.length === 0) {
                    this._methods.push(newItem);
                } else {
                    this._methods.splice(this.checkIfTheSpliceIndexCorrect(itemType, key, newItem) ? key + 1 : key, 0, newItem);
                }
                this._methods = sortByIndex(this._methods);
                break;
            case OPERATOR_ITEM:
                if (this._operators.length === 0) {
                    this._operators.push(newItem);
                } else {
                    this._operators.splice(this.checkIfTheSpliceIndexCorrect(itemType, key, newItem) ? key + 1 : key, 0, newItem);
                }
                this._operators = sortByIndex(this._operators);
                break;
        }
        this.setCurrentItem(newItem);
    }

    addMethod(method, mode = OUTSIDE_ITEM){
        this.addItem(METHOD_ITEM, method, mode);
    }

    getMethodByIndex(index){
        let method = this._methods.find(m => m.index === index);
        return method ? method : null;
    }

    getOperatorByIndex(index){
        let operator = this._operators.find(o => o.index === index);
        return operator ? operator : null;
    }

    getCloserItem(itemIndex){
        let result = null;
        let closerItemIndex = '';
        if(itemIndex) {
            if(itemIndex !== '') {
                let itemIndexSplitted = itemIndex.split('_');
                if (itemIndexSplitted.length > 0){
                    let lastIndexElement = itemIndexSplitted[itemIndexSplitted.length - 1];
                    if(lastIndexElement !== '0'){
                        itemIndexSplitted[itemIndexSplitted.length - 1] = itemIndexSplitted[itemIndexSplitted.length - 1] - 1;
                    } else{
                        if(itemIndexSplitted.length > 1){
                            itemIndexSplitted.splice(-1, 1);
                        }
                    }
                    closerItemIndex = itemIndexSplitted.join('_');
                }
            }
        }
        if(closerItemIndex !== ''){
            result = this._methods.find(m => m.index === closerItemIndex);
            if(!result){
                result = this._operators.find(o => o.index === closerItemIndex);
            }
            if(!result){
                result = null;
            }
        }
        return result;
    }

    isLastItemInTheTree(index){
        let splitIndex = index.split('_');
        let lastMethod = this._methods.length !== 0 ? this._methods[this._methods.length - 1] : null;
        let lastOperator = this._operators.length !== 0 ? this._operators[this._operators.length - 1] : null;
        let isLastMethod = false;
        let isLastOperator = false;
        if(lastMethod !== null){
            if(lastMethod.index === index){
                isLastMethod = true;
            }
        }
        if(lastOperator !== null){
            if(lastOperator.index === index){
                isLastOperator = true;
            }
        }
        if(isLastMethod){
            if(lastOperator !== null) {
                let splitLastOperatorIndex = lastOperator.index.split('_');
                for (let i = 0; i < splitLastOperatorIndex.length; i++) {
                    if (parseInt(splitLastOperatorIndex[i]) > parseInt(splitIndex[i])) {
                        return false;
                    }
                }
            }
        }
        if(isLastOperator){
            if(lastMethod !== null) {
                let splitLastMethodIndex = lastMethod.index.split('_');
                for (let i = 0; i < splitLastMethodIndex.length; i++) {
                    if (parseInt(splitLastMethodIndex[i]) > parseInt(splitIndex[i])) {
                        return false;
                    }
                }
            }
        }
        return !(!isLastMethod && !isLastOperator);
    }


    removeMethod(method, withRefactorIndexes = true){
        let methodIndex = method.index;
        let key = this._methods.findIndex(m => m.index === method.index);
        if(key !== -1) {
            if(withRefactorIndexes && !this.isLastItemInTheTree(methodIndex)) {
                let index = key + 1 < this._methods.length ? this._methods[key + 1].index : this._methods[key].index;
                this.refactorIndexes(index, REFACTOR_REMOVE, 'method', methodIndex);
            }
            this._methods.splice(key, 1);

            this._methods = sortByIndex(this._methods);
            if(withRefactorIndexes) {
                this.setCurrentItem(this.getCloserItem(methodIndex));
            }
        }
    }

    addOperator(operator, mode = OUTSIDE_ITEM){
        this.addItem(OPERATOR_ITEM, operator, mode);
    }

    removeOperator(operator, withRefactorIndexes = true, isParent = false){
        let operatorIndex = operator.index;
        let key = this._operators.findIndex(o => o.index === operator.index);
        if(key !== -1) {
            if(withRefactorIndexes && !this.isLastItemInTheTree(operatorIndex)) {
                let index = key + 1 < this._operators.length ? this._operators[key + 1].index : this._operators[key].index;
                if(isParent){
                    index = operator.index;
                }
                this.refactorIndexes(index, REFACTOR_REMOVE, 'operator', operatorIndex);
            }
            this._operators.splice(key, 1);
            this._operators = sortByIndex(this._operators);
            if(withRefactorIndexes) {
                this.setCurrentItem(this.getCloserItem(operatorIndex));
            }
        }
    }

    generateNextIndex(mode){
        let result = '0';
        if(this._currentItem) {
            switch (mode) {
                case INSIDE_ITEM:
                    result = `${this._currentItem.index}_0`;
                    break;
                case OUTSIDE_ITEM:
                    let indexes = this._currentItem.index.split('_');
                    if(indexes.length >= 1){
                        indexes[indexes.length - 1] = parseInt(indexes[indexes.length - 1]) + 1;
                    }
                    result = indexes.join('_');
                    break;
            }
        }
        return result;
    }

    getConnectorType(){
        return this._connectorType;
    }

    setConnectorType(connectorType){
        this._connectorType = this.checkConnectorType(connectorType) ? connectorType : '';
    }

    getMethodByColor(color){
        let method = this._methods.find(m => m.color === color);
        return method ? method : null;
    }

    getPrefixForMethodOption(){
        return this.getConnectorType() === CONNECTOR_FROM ? 'f_': 't_';
    }

    getAllPrevMethods(item, isKeyConsidered = true, exceptCurrent = true){
        let methods = [];
        let itemIndexSplitter = item.index.split('_');
        let shouldStop = false;
        for(let i = 0; i < this._methods.length; i++){
            let methodIndex = this._methods[i].index;
            if(exceptCurrent && methodIndex === item.index){
                break;
            }
            let methodIndexSplitter = methodIndex.split('_');
            let method = null;
            if(isKeyConsidered) {
                for (let j = 0; j < methodIndexSplitter.length; j++) {
                    if ((parseInt(methodIndexSplitter[j]) <= parseInt(itemIndexSplitter[j]) && j === methodIndexSplitter.length - 1)) {
                        method = this._methods[i];
                    }
                    if (parseInt(methodIndexSplitter[j]) > parseInt(itemIndexSplitter[j])) {
                        shouldStop = true;
                        break;
                    }
                }
            } else{
                method = this._methods[i];
            }
            if(method){
                methods.push({
                    label: method.name,
                    value: `${this.getPrefixForMethodOption()}${method.index}`,
                    color: method.color,
                });
            }
            if(shouldStop){
                break;
            }
        }
        return methods;
    }

    getObject(){
        let methods = [];
        for (let i = 0; i < this._methods.length; i++){
            methods.push(this._methods[i].getObject());
        }
        let operators = [];
        for (let i = 0; i < this._operators.length; i++){
            operators.push(this._operators[i].getObject());
        }
        let obj = {
            invoker: {name: this._invoker.name},
            connectorId: this._id,
            methods: methods,
            operators: operators,
        };
        if(this.hasOwnProperty('_id')){
            obj.connectorId = this._id;
        }
        return obj;
    }
}