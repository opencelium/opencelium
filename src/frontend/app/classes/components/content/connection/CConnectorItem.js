/*
 * Copyright (C) <2021>  <becon GmbH>
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

import {consoleLog, isId, isString, sortByIndex, subArrayToString} from "@utils/app";
import CMethodItem from "./method/CMethodItem";
import COperatorItem, {LOOP_OPERATOR} from "./operator/COperatorItem";
import CInvoker from "../invoker/CInvoker";
import CConnectorPagination from "./CConnectorPagination";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import COperator, {OPERATOR_SIZE} from "@classes/components/content/connection_overview_2/operator/COperator";
import React from "react";
import CProcess, {
    PROCESS_HEIGHT,
    PROCESS_WIDTH
} from "@classes/components/content/connection_overview_2/process/CProcess";

export const INSIDE_ITEM = 'in';
export const OUTSIDE_ITEM = 'out';
const REFACTOR_ADD = 'add';
const REFACTOR_REMOVE = 'delete';
export const CONNECTOR_FROM = 'fromConnector';
export const CONNECTOR_TO = 'toConnector';
export const METHOD_ITEM = 'method';
export const OPERATOR_ITEM = 'operator';

export const CONNECTOR_DEPTH_LIMIT = 1000;

export const ITERATOR_NAMES = [
    'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'ii', 'ij', 'ik', 'il', 'im', 'in', 'io', 'ip', 'iq', 'ir', 'is', 'it', 'iu', 'iv', 'iw', 'ix', 'iy', 'iz'
];

const PANEL_LABEL_INTEND = 40;
const PANEL_PADDING_SIDES = 10;
const PANEL_DISTANT = 150;
const PANEL_MARGIN_RECT = 1;

/**
 * Connector class for manipulating data in the Connector Component
 * also it is a part of Connection Component
 */
export default class CConnectorItem{

    constructor(connectorId = 0, title = '', icon, invoker = null, methods = [], operators = [], connectorType = '', shiftXForSvgItems = 0, currentItemIndex = ''){
        this._id = isId(connectorId) ? connectorId : 0;
        this._title = title === '' ? 'Please, choose connector' : title;
        this._icon = isString(icon) ? icon : '';
        this._invoker = this.convertInvoker(invoker);
        this._connectorType = this.checkConnectorType(connectorType) ? connectorType : '';
        this._shiftXForSvgItems = shiftXForSvgItems;
        this._methods = this.convertMethods(methods);
        this._operators = this.convertOperators(operators);
        this._currentItem = currentItemIndex !== '' ? this.getItemByIndex(currentItemIndex) : null;
        this._svgItems = [];
        this._arrows = [];
        this._pagination = this.setConnectorPagination();
        this._currentProgress = this.getCurrentProgress();
        this._operatorsHistory = [];
        this.setSvgItems();
    }

    static createConnectorItem(connectorItem){
        let connectorId = connectorItem && connectorItem.hasOwnProperty('connectorId') ? connectorItem.connectorId : 0;
        let title = connectorItem && connectorItem.hasOwnProperty('title') ? connectorItem.title : '';
        let icon = connectorItem && connectorItem.hasOwnProperty('icon') ? connectorItem.icon : '';
        let invoker = connectorItem && connectorItem.hasOwnProperty('invoker') ? connectorItem.invoker : null;
        let methods = connectorItem && connectorItem.hasOwnProperty('methods') ? connectorItem.methods : [];
        let operators = connectorItem && connectorItem.hasOwnProperty('operators') ? connectorItem.operators : [];
        let connectorType = connectorItem && connectorItem.hasOwnProperty('connectorType') ? connectorItem.connectorType : '';
        let shiftXForSvgItems = connectorItem && connectorItem.hasOwnProperty('shiftXForSvgItems') ? connectorItem.shiftXForSvgItems : 0;
        let currentItemIndex = connectorItem && connectorItem.hasOwnProperty('currentItemIndex') ? connectorItem.currentItemIndex : '';
        return new CConnectorItem(connectorId, title, icon, invoker, methods, operators, connectorType, shiftXForSvgItems, currentItemIndex);
    }

    static hasIcon(icon){
        return isString(icon) && icon !== '' && icon.substr(icon.length - 5) !== '/null';
    }

    static getPanelPosition(items, shiftXForSvgItems){
        let width = CConnectorItem.getMaxXOfSvgItems(items) - shiftXForSvgItems + PANEL_PADDING_SIDES;
        let height = CConnectorItem.getMaxYOfSvgItems(items) + PANEL_LABEL_INTEND + PANEL_PADDING_SIDES;
        if(width < 350){
            width = 350;
        }
        if(height < 300){
            height = 300;
        }
        return {x: shiftXForSvgItems - PANEL_PADDING_SIDES, y: -PANEL_LABEL_INTEND - PANEL_PADDING_SIDES, width, height};
    }

    static getPanelRectPosition(items, shiftXForSvgItems){
        const panelPosition = CConnectorItem.getPanelPosition(items, shiftXForSvgItems);
        return { x: PANEL_MARGIN_RECT, y: PANEL_LABEL_INTEND - PANEL_MARGIN_RECT, width: panelPosition.width - PANEL_MARGIN_RECT, height: panelPosition.height - PANEL_LABEL_INTEND - PANEL_MARGIN_RECT};
    }

    getShiftXOfSvgItems(){
        return CConnectorItem.getMaxXOfSvgItems(this._svgItems) + PANEL_DISTANT;
    }

    static getMaxCoordinateOfSvgItems(coordinateType, items = []){
        let maxValue = 0;
        let isProcess = false;
        let isOperator = false;
        const processSize = coordinateType === 'x' ? PROCESS_WIDTH : PROCESS_HEIGHT;
        for(let i = 0; i < items.length; i++){
            if(items[i] instanceof CProcess){
                if(items[i][coordinateType] + processSize > maxValue) {
                    isProcess = true;
                    isOperator = false;
                    maxValue = items[i][coordinateType] + processSize;
                }
            }
            if(items[i] instanceof COperator){
                if(items[i][coordinateType] + OPERATOR_SIZE > maxValue) {
                    isProcess = false;
                    isOperator = true;
                    maxValue = items[i][coordinateType] + OPERATOR_SIZE;
                }
            }
        }

        if(maxValue === 0 && items.length > 0){
            if(isOperator){
                maxValue += OPERATOR_SIZE + PANEL_PADDING_SIDES;
            }
            if(isProcess){
                maxValue += processSize + PANEL_PADDING_SIDES;
            }
        }
        if(maxValue !== 0){
            maxValue += PANEL_PADDING_SIDES;
        }
        if(maxValue < 330){
            maxValue = 330;
        }
        return maxValue;

    }

    static getMaxXOfSvgItems(items){
        return CConnectorItem.getMaxCoordinateOfSvgItems('x', items);
    }

    static getMaxYOfSvgItems(items){
        return CConnectorItem.getMaxCoordinateOfSvgItems('y', items);
    }

    getSvgElementByIndex(index){
        return this._svgItems.find(svgItem => svgItem.entity.index === index);
    }

    getSvgElement(element){
        if(element instanceof CTechnicalOperator || element instanceof CTechnicalProcess){
            return element
        }
        if(element.hasOwnProperty('type')){
            return CTechnicalOperator.createTechnicalOperator(element);
        } else{
            return CTechnicalProcess.createTechnicalProcess(element);
        }
    }

    setSvgItems(){
        this._svgItems = [];
        this._arrows = [];
        let items = [...this.methods, ...this.operators];
        items = sortByIndex(items);
        let xIterator = 0;
        for(let i = 0; i < items.length; i++){
            let svgElement = {};
            svgElement.name = items[i].name ? items[i].name : '';
            svgElement.label = items[i].label ? items[i].label : '';
            svgElement.entity = items[i];
            if(items[i].type) {
                svgElement.type = items[i].type;
            }
            let currentSplitIndex = items[i].index.split('_');
            if(currentSplitIndex[currentSplitIndex.length - 1] !== '0'){
                xIterator += 200;
            }
            svgElement.x = xIterator + this._shiftXForSvgItems;
            svgElement.y = 150 * (currentSplitIndex.length - 1);
            svgElement.connectorType = this.getConnectorType();
            if(items[i].type && items.length !== 1){
                svgElement.x += 35;
                svgElement.y += 10;
            }
            svgElement.id = `${this.getConnectorType()}_${items[i].index}`;
            this._svgItems.push(this.getSvgElement(svgElement));
            if(items[i].index !== '0') {
                this.arrows.push({from: `${this.getConnectorType()}_${this.getPrevIndex(items[i].index)}`, to: `${this.getConnectorType()}_${items[i].index}`});
            }
        }
    }

    getPrevIndex(index){
        if(index === '0'){
            return '';
        }
        let splitIndex = index.split('_');
        if(splitIndex[splitIndex.length - 1] === '0'){
            splitIndex.pop();
            return splitIndex.join('_');
        } else{
            splitIndex[splitIndex.length - 1] = splitIndex[splitIndex.length - 1] - 1;
            return splitIndex.join('_');
        }
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

    getMethodByColor(color){
        let method = this._methods.find(m => m.color === color);
        if(method){
            return method;
        }
        return null;
    }

    checkConnectorType(connectorType){
        return connectorType === CONNECTOR_FROM || connectorType === CONNECTOR_TO;
    }

    resetItems(){
        this._methods = [];
        this._operators = [];
        this._svgItems = [];
        this._arrows = [];
        this._currentItem = null;
        this.reloadPagination();
        this.reloadOperatorsHistory();
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
            return COperatorItem.createOperatorItem(operator, this);
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

    setConnectorPagination(){
        return CConnectorPagination.createConnectorPagination(this);
    }

    getCurrentProgress(item = null){
        if(item === null){
            item = this._currentItem;
        }
        let result = 0;
        let currentIndex = 0;
        let allItems = [];
        if(item){
            currentIndex = item.index;
            if(this._pagination.allItems){
                allItems = this._pagination.allItems;
            }
            for(let i = 0; i < allItems.length; i++){
                if(allItems[i].index === currentIndex){
                    if(i === allItems.length - 1){
                        result = 100;
                    } else {
                        result = Math.ceil((i * 100) / allItems.length);
                    }
                    break;
                }
            }
        }
        return result;
    }

    loadPage(number){
        this._pagination.setCurrentPageNumber(number);
        this._currentProgress = this.getCurrentProgress();
    }

    reloadPagination(settings){
        this._pagination.reload(this, settings);
        this._currentProgress = this.getCurrentProgress();
    }

    reloadOperatorsHistory(){
        this._operatorsHistory = [];
        if(this._currentItem !== null) {
            let indexSplitted = this._currentItem.index.split('_');
            if(indexSplitted.length > 1) {
                let operatorIndex = indexSplitted[0];
                for (let i = 1; i < indexSplitted.length; i++) {
                    let operator = this._operators.find(o => o.index === operatorIndex);
                    if(operator) {
                        this._operatorsHistory.push(operator);
                    }
                    operatorIndex += `_${indexSplitted[i]}`;
                }
            }
            this.reloadPagination();
        }
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
        this.reloadPagination();
    }

    filterByNameOrType(filterValue){
        let filterValues = filterValue.split('>');
        for(let i = 0; i < filterValues.length; i++) {
            this.filterByNameOrTypeIteration(i, filterValues[i]);
        }
    }

    filterByNameOrTypeIteration(step, filterValue){
        let tmpOperators = [];
        for(let i = 0; i < this._operators.length; i++){
            let indexSplit = this._operators[i].index.split('_');
            if(indexSplit.length > step) {
                if (this._operators[i].type.toLowerCase().includes(filterValue.toLowerCase()) || filterValue === '') {
                    tmpOperators.push(this._operators[i]);
                    let operatorIndex = this._operators[i].index;
                    let parentIndex = subArrayToString(operatorIndex.split('_'), '_', 0, operatorIndex.split('_').length - 1);
                    let parent = this._operators.find(operator => operator.index === parentIndex);
                    if(parent && step > 0){
                        this._operators[i].isDisabled = parent.isDisabled;
                    } else{
                        this._operators[i].isDisabled = false;
                    }
                } else {
                    this._operators[i].isDisabled = true;
                }
            }
        }
        for(let i = 0; i < this._methods.length; i++){
            let indexSplit = this._methods[i].index.split('_');
            if(indexSplit.length > step) {
                if (this._methods[i].name.toLowerCase().includes(filterValue.toLowerCase())
                    || filterValue === ''
                    || tmpOperators.findIndex(operator => this._methods[i].index.indexOf(operator.index) === 0) !== -1
                ) {
                    let methodIndex = this._methods[i].index;
                    let parentIndex = subArrayToString(methodIndex.split('_'), '_', 0, methodIndex.split('_').length - 1);
                    let parent = this._operators.find(operator => operator.index === parentIndex);
                    if(parent && step > 0){
                        this._methods[i].isDisabled = parent.isDisabled;
                    } else{
                        this._methods[i].isDisabled = false;
                    }
                } else {
                    this._methods[i].isDisabled = true;
                }
            }
        }
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

    get icon(){
        return this._icon;
    }

    set icon(icon){
        this._icon = icon;
    }

    get invoker(){
        return this._invoker;
    }

    set invoker(invoker){
        this._invoker = this.convertInvoker(invoker);
        this.updateInvokerForMethods();
        this.setSvgItems()
    }

    get methods(){
        return this._methods;
    }

    set methods(methods){
        this._methods = this.convertMethods(methods);
        this.setSvgItems();
    }

    get operators(){
        return this._operators;
    }

    set operators(operators){
        this._operators = this.convertOperators(operators);
        this.setSvgItems();
    }

    get svgItems(){
        return this._svgItems;
    }

    get arrows(){
        return this._arrows;
    }

    get pagination(){
        return this._pagination;
    }

    get operatorsHistory(){
        return this._operatorsHistory;
    }

    getCurrentItem(){
        if(this._currentItem === null){
            if(this._methods.length !== 0){
                this._currentItem = this._methods[this._methods.length - 1];
            }
        }
        return this._currentItem;
    }

    setHeadersForMethods(invoker = null){
        if(invoker === null){
            invoker = this._invoker;
            if(invoker){
                for(let i = 0; i < this._methods.length; i++){
                    const operation = invoker.operations.find(operation => operation.name === this._methods[i].name);
                    if(operation) {
                        this._methods[i].request.setHeader(operation.request.header);
                        this._methods[i].response.success.setHeader(operation.response.success.header);
                        this._methods[i].response.fail.setHeader(operation.response.fail.header);
                    }
                }
            }
        }
    }

    setCurrentItem(item){
        this._currentItem = item ? item : null;
        this.reloadOperatorsHistory();
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

    refactorIndexes(index, refactorMode = REFACTOR_ADD){
        this.refactorIndexesForItems(index, refactorMode, this.methods);
        this.refactorIndexesForItems(index, refactorMode, this.operators);
    }

    refactorIndexesForItems(index, refactorMode = REFACTOR_ADD, items){
        let splitIndex = index.split('_');
        for(let i = 0; i < items.length; i++){
            let splitMethodIndex = items[i].index.split('_');
            if(splitMethodIndex.length >= splitIndex.length){
                //if index except last number equals to prefix of method index
                if(splitMethodIndex.slice(0, splitIndex.length - 1).join('_') === splitIndex.slice(0, splitIndex.length - 1).join('_')){
                    if(splitMethodIndex[splitIndex.length - 1] >= splitIndex[splitIndex.length - 1]){
                        switch (refactorMode){
                            case REFACTOR_ADD:
                                splitMethodIndex[splitIndex.length - 1] = parseInt(splitMethodIndex[splitIndex.length - 1]) + 1;
                                break;
                            case REFACTOR_REMOVE:
                                splitMethodIndex[splitIndex.length - 1] -= 1;
                                break;
                        }
                        items[i].index = splitMethodIndex.join('_');
                    }
                }
            }
        }

    }

    refactorIndexes_old(index, refactorMode = REFACTOR_ADD, itemType, originalIndex){
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
        let key = this.findPrevItemIndex(itemType, currentIndex, mode);
        if(!newItem.index) {
            newItem.index = nextIndex;
            this.refactorIndexes(nextIndex, REFACTOR_ADD);
        }
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
                if(newItem.type === LOOP_OPERATOR){
                    newItem.iterator = CConnectorItem.getIterator(this._operators, newItem, key);
                }
                if (this._operators.length === 0) {
                    this._operators.push(newItem);
                } else {
                    this._operators.splice(this.checkIfTheSpliceIndexCorrect(itemType, key, newItem) ? key + 1 : key, 0, newItem);
                }
                this._operators = sortByIndex(this._operators);
                break;
        }
        this.setCurrentItem(newItem);
        this.reloadPagination({newItem});
        this.setSvgItems();
    }

    // max can be 18 depth of loop operators
    static getIterator(operators, operator, prevIndex) {
        let result = ITERATOR_NAMES[0];
        let splitOperatorIndex = operator.index.split('_');
        if(splitOperatorIndex.length > 1) {
            let decreasedOperatorIndex = '';
            let prevOperator = null;
            let decreaseIterator = 1;
            while (true) {
                decreasedOperatorIndex = splitOperatorIndex.slice(0, splitOperatorIndex.length - decreaseIterator).join('_')
                prevOperator = operators.find(op => op.index === decreasedOperatorIndex);
                if (!prevOperator || prevOperator.type === LOOP_OPERATOR) {
                    break;
                }
                decreaseIterator++;
            }
            if (prevOperator && prevOperator.iterator) {
                let prevIteratorIndex = ITERATOR_NAMES.indexOf(prevOperator.iterator);
                if (prevIteratorIndex >= 0) {
                    result = ITERATOR_NAMES[prevIteratorIndex + 1];
                }
            }
        }
        return result;
    }
    /*static getIterator(operators, operator, prevIndex){
        let result = ITERATOR_NAMES[0];
        let prevOperator = operators[prevIndex];
        if(typeof prevOperator !== "undefined"){
            let reservedIterators = [];
            let splitOperatorIndex = operator.index.split('_');
            if(splitOperatorIndex.length > 0) {
                let indexForIteratedIndex = 0;
                let iteratedIndex = splitOperatorIndex[0];
                for(let i = 0; i <= prevIndex; i++){
                    if(operators[i].index === iteratedIndex && operators[i].type === LOOP_OPERATOR){
                        reservedIterators.push(operators[i].iterator);
                        indexForIteratedIndex++;
                        iteratedIndex += `_${splitOperatorIndex[indexForIteratedIndex]}`;
                    }
                }
            }
            for(let i = prevIndex + 1; i < operators.length; i++){
                let iteratedOperator = operators[i];
                if(iteratedOperator.type === LOOP_OPERATOR) {
                    if (iteratedOperator.index.length >= operator.index) {
                        if (iteratedOperator.index.substr(0, operator.index.length) === operator.index) {
                            reservedIterators.push(iteratedOperator.iterator);
                        }
                    }
                }
            }
            result = ITERATOR_NAMES.filter(name => reservedIterators.indexOf(name) === -1);
            if(result.length > 0){
                result = result[0];
            } else{
                result = 'ii';
            }
        }
        return result;
    }*/

    addMethod(method, mode = OUTSIDE_ITEM){
        this.addItem(METHOD_ITEM, method, mode);
    }

    getItemByIndex(index){
        const method = this.getMethodByIndex(index);
        if(method === null){
            return this.getOperatorByIndex(index);
        }
        return method;
    }

    getMethodByIndex(index){
        let method = this._methods.find(m => m.index === index);
        return method ? method : null;
    }

    getOperatorByIndex(index){
        let operator = this._operators.find(o => o.index === index);
        return operator ? operator : null;
    }

    getPreviousIterators(){
        let previousIterators = [];
        let currentItem = this._currentItem;
        if(currentItem) {
            let splitMethodIndex = currentItem.index.split('_');
            let previousOperatorIndex = splitMethodIndex.length === 1 ? -1 : splitMethodIndex.slice(0, -1).join('_');
            let previousOperatorArrayIndex = this.operators.findIndex(operator => operator.index === previousOperatorIndex);
            if(previousOperatorArrayIndex !== -1) {
                while (true) {
                    if (this.operators[previousOperatorArrayIndex].type === LOOP_OPERATOR) {
                        break;
                    } else {
                        if (previousOperatorArrayIndex === 0) {
                            break;
                        }
                        previousOperatorArrayIndex--;
                    }
                }
                const previousOperator = this.operators[previousOperatorArrayIndex];
                if (previousOperator) {
                    let iteratorName = previousOperator.iterator;
                    if (ITERATOR_NAMES.indexOf(iteratorName) === -1) {
                        return previousIterators;
                    }
                    for (let i = 0; i < ITERATOR_NAMES.length; i++) {
                        previousIterators.push(ITERATOR_NAMES[i]);
                        if (ITERATOR_NAMES[i] === iteratorName) {
                            break;
                        }
                    }
                }
            }
        }
        return previousIterators;
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
        let increasedLastIndex = parseInt(splitIndex[splitIndex.length - 1]) + 1;
        splitIndex[splitIndex.length - 1] = increasedLastIndex;
        let nextIndex = splitIndex.join('_');
        let isExistNextIndexInMethods = this._methods.findIndex(m => m.index === nextIndex) !== -1;
        if(!isExistNextIndexInMethods){
            let isExistNextIndexInOperators = this._operators.findIndex(o => o.index === nextIndex) !== -1;
            return !isExistNextIndexInOperators;
        }
        return !isExistNextIndexInMethods;
    }


    removeMethod(method, withRefactorIndexes = true){
        let methodIndex = method.index;
        let key = this._methods.findIndex(m => m.index === methodIndex);
        if(key !== -1) {
            if(withRefactorIndexes && !this.isLastItemInTheTree(methodIndex)) {
                let index = key + 1 < this._methods.length ? this._methods[key + 1].index : this._methods[key].index;
                this.refactorIndexes(methodIndex, REFACTOR_REMOVE, 'method', methodIndex);
            }
            this._methods.splice(key, 1);

            this._methods = sortByIndex(this._methods);
            if(withRefactorIndexes) {
                this.setCurrentItem(this.getCloserItem(methodIndex));
            }
        }
        this.reloadPagination();
        this.setSvgItems();
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
                this.refactorIndexes(operatorIndex, REFACTOR_REMOVE, 'operator', operatorIndex);
            }
            this._operators.splice(key, 1);
            this._operators = sortByIndex(this._operators);
            if(withRefactorIndexes) {
                this.setCurrentItem(this.getCloserItem(operatorIndex));
            }
        }
        this.reloadPagination();
        this.setSvgItems();
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

    get shiftXForSvgItems(){
        return this._shiftXForSvgItems;
    }

    set shiftXForSvgItems(shiftXForSvgItems){
        this._shiftXForSvgItems = shiftXForSvgItems;
    }

    getMethodByColor(color){
        let method = this._methods.find(m => m.color === color);
        return method ? method : null;
    }

    getPrefixForMethodOption(){
        return this.getConnectorType() === CONNECTOR_FROM ? 'f_': 't_';
    }

    get currentProgress(){
        return this._currentProgress;
    }

    decreaseIndex(index) {
        let newIndex = '0';
        if(index !== '0') {
            let indexSplit = index.split('_');
            if (indexSplit.length > 0) {
                if (indexSplit[indexSplit.length - 1] !== '0') {
                    indexSplit[indexSplit.length - 1] = parseInt(indexSplit[indexSplit.length - 1]) - 1;
                    newIndex = subArrayToString(indexSplit, '_', 0, indexSplit.length);
                } else{
                    newIndex = subArrayToString(indexSplit, '_', 0, indexSplit.length - 1);
                }
            }
        }
        return newIndex;
    }

    getAllPrevMethods(item, isKeyConsidered = true, exceptCurrent = true){
        let methods = [];
        let itemIndexSplitter = item.index.split('_');
        if(isKeyConsidered){
            let decreasedIndex = this.decreaseIndex(item.index);
            for(let i = 0; i < itemIndexSplitter.length; i++){
                let indexLimit = decreasedIndex.split('_').length - 1;
                while(decreasedIndex.split('_').length > indexLimit){
                    let method = this._methods.find(method => method.index === decreasedIndex);
                    if (method) {
                        methods.push({
                            label: method.name,
                            value: `${this.getPrefixForMethodOption()}${method.index}`,
                            color: method.color,
                        });
                    }
                    if(decreasedIndex === '0'){
                        return methods.reverse()
                    }
                    decreasedIndex = this.decreaseIndex(decreasedIndex);
                }
            }
        } else {
            for (let i = 0; i < this._methods.length; i++) {
                let methodIndex = this._methods[i].index;
                if (exceptCurrent && methodIndex === item.index) {
                    break;
                }
                let method = this._methods[i];
                if (method) {
                    methods.push({
                        label: method.name,
                        value: `${this.getPrefixForMethodOption()}${method.index}`,
                        color: method.color,
                    });
                }
            }
        }
        return methods.reverse();
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
            icon: this._icon,
            operators: operators,
        };
        if(this.hasOwnProperty('_id')){
            obj.connectorId = this._id;
        }
        return obj;
    }

    getObjectForConnectionOverview(){
        return {
            ...this.getObject(),
            title: this._title,
            invoker: this._invoker.getObject(),
            currentItemIndex: this._currentItem ? this._currentItem.index : '',
        }
    }
}