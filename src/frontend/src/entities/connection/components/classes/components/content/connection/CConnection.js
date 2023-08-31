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

import {consoleLog, isId} from "@application/utils/utils";
import CConnectorItem, {CONNECTOR_FROM, CONNECTOR_TO, OUTSIDE_ITEM} from "./CConnectorItem";
import CFieldBinding from "./field_binding/CFieldBinding";
import CTemplate from "./CTemplate";
import CBindingItem from "./field_binding/CBindingItem";
import {RESPONSE_FAIL, RESPONSE_SUCCESS} from "../invoker/response/CResponse";
import {STATEMENT_REQUEST, STATEMENT_RESPONSE} from "./operator/CStatement";
 import CMethodItem from "@classes/content/connection/method/CMethodItem";
 import COperatorItem from "@classes/content/connection/operator/COperatorItem";
 import CAggregator from "@classes/content/connection/data_aggregator/CAggregator";

const DEFAULT_COLOR = '#ffffff';

export const ALL_COLORS = [
    '#FFCFB5', '#C77E7E', '#6477AB', '#98BEC7',
    '#9EC798', '#BFC798', '#E6E6EA', '#F4B6C2',
    '#E41298', '#F0E4E4', '#FE8A71', '#E7EFF6',
    '#5FC798', '#AF28E4', '#A6E6EA', '#E1C798',
    '#1FCFB5', '#F346C2', '#3477AB', '#44BEC7',
    '#5EC798', '#B12798', '#76E6EA', '#84B6C2',
    '#4173AB', '#A0E4E4', '#BE8A71', '#C7EFF6',
    '#DFC798', '#EF3798', '#F6E6EA', '#11C798',
    '#F12FB5', '#C1227E', '#6122AB', '#912EC7',
    '#912798', '#6FC798', '#E123EA', '#277E7E',
    '#B45DE0', '#F456E4', '#328A71', '#31EFF6',
    '#312798', '#F11798', '#A3210A', '#E33798',
    '#1363B0', '#561E7E', '#93CDE0', '#456EC7',
    '#578998', '#687698', '#7543EA', '#8234C2',
    '#977DE0', '#5F3798', '#BF2A71', '#C723F6',
    '#D13298', '#B3CDE0', '#F512EA', '#4F3444',
    '#1FCFB1', '#177EB1', '#1477B1', '#18BEB1',
    '#1EC7B1', '#1FC7B1', '#16E6B1', '#14B6B1',
    '#1412B1', '#10E4B1', '#1E8AB1', '#17EFB1',
    '#1FC7B1', '#1F28B1', '#16E6B1', '#11C7B1',
    '#1FCFB1', '#1346B1', '#1477B1', '#14BEB1',
    '#1EC7B1', '#1127B1', '#16E6B1', '#14B6B1',
    '#1173B1', '#10E4B1', '#1E8AB1', '#17EFB1',
    '#1FC7B1', '#1F37B1', '#16E6B1', '#11C7B1',
    '#112F11', '#112277', '#112231', '#112EF1',
    '#1127B1', '#1FC7B1', '#1123B1', '#177EB1',
    '#145DB1', '#1456B1', '#128AB1', '#11EFB1',
    '#5127B1', '#2117B1', '#A321B1', '#4337B1',
    '#1363B1', '#161EB1', '#13CDB1', '#156EB1',
    '#1789B1', '#1876B1', '#1543B1', '#1234B1',
    '#177DB1', '#1F37B1', '#1F2AB1', '#1723B1',
    '#1132B1', '#13CDB1', '#1512B1', '#1F34B1',
];

/**
 * Connection class for manipulating data in the Connection Component
 */
export default class CConnection{

    constructor(connectionId = 0, title = '', description = '', fromConnector = null, toConnector = null, fieldBindingItems = [], template = null, error = null, readOnly = false, dataAggregator = []){
        if(connectionId !== 0){
            this._id = isId(connectionId) ? connectionId : 0;
        }
        this._title = title;
        this._description = description;
        if(fromConnector !== null){
            fromConnector.connectorType = CONNECTOR_FROM;
        }
        if(toConnector !== null){
            toConnector.connectorType = CONNECTOR_TO;
        }
        this._fromConnector = CConnectorItem.createConnectorItem(fromConnector);
        if(toConnector !== null && this._fromConnector instanceof CConnectorItem) {
            toConnector.shiftXForSvgItems = this._fromConnector.getShiftXOfSvgItems();
        }
        this._toConnector = CConnectorItem.createConnectorItem(toConnector);
        this._fieldBinding = this.convertFieldBindingItems(fieldBindingItems);
        this._template = this.convertTemplate(template);
        this._allTemplates = [];
        this._colors = [
            '#FFCFB5', '#C77E7E', '#6477AB', '#98BEC7',
            '#9EC798', '#BFC798', '#E6E6EA', '#F4B6C2',
            '#E41298', '#F0E4E4', '#FE8A71', '#E7EFF6',
            '#5FC798', '#AF28E4', '#A6E6EA', '#E1C798',
            '#1FCFB5', '#F346C2', '#3477AB', '#44BEC7',
            '#5EC798', '#B12798', '#76E6EA', '#84B6C2',
            '#4173AB', '#A0E4E4', '#BE8A71', '#C7EFF6',
            '#DFC798', '#EF3798', '#F6E6EA', '#11C798',
            '#F12FB5', '#C1227E', '#6122AB', '#912EC7',
            '#912798', '#6FC798', '#E123EA', '#277E7E',
            '#B45DE0', '#F456E4', '#328A71', '#31EFF6',
            '#312798', '#F11798', '#A3210A', '#E33798',
            '#1363B0', '#561E7E', '#93CDE0', '#456EC7',
            '#578998', '#687698', '#7543EA', '#8234C2',
            '#977DE0', '#5F3798', '#BF2A71', '#C723F6',
            '#D13298', '#B3CDE0', '#F512EA', '#4F3444',
            '#1FCFB1', '#177EB1', '#1477B1', '#18BEB1',
            '#1EC7B1', '#1FC7B1', '#16E6B1', '#14B6B1',
            '#1412B1', '#10E4B1', '#1E8AB1', '#17EFB1',
            '#1FC7B1', '#1F28B1', '#16E6B1', '#11C7B1',
            '#1FCFB1', '#1346B1', '#1477B1', '#14BEB1',
            '#1EC7B1', '#1127B1', '#16E6B1', '#14B6B1',
            '#1173B1', '#10E4B1', '#1E8AB1', '#17EFB1',
            '#1FC7B1', '#1F37B1', '#16E6B1', '#11C7B1',
            '#112F11', '#112277', '#112231', '#112EF1',
            '#1127B1', '#1FC7B1', '#1123B1', '#177EB1',
            '#145DB1', '#1456B1', '#128AB1', '#11EFB1',
            '#5127B1', '#2117B1', '#A321B1', '#4337B1',
            '#1363B1', '#161EB1', '#13CDB1', '#156EB1',
            '#1789B1', '#1876B1', '#1543B1', '#1234B1',
            '#177DB1', '#1F37B1', '#1F2AB1', '#1723B1',
            '#1132B1', '#13CDB1', '#1512B1', '#1F34B1',];
        for(let i = 0; i < this._fromConnector.methods.length; i++){
            this.removeRestColor(this._fromConnector.methods[i].color);
        }
        for(let i = 0; i < this._toConnector.methods.length; i++){
            this.removeRestColor(this._toConnector.methods[i].color);
        }
        this._currentFieldBindingTo = -1;
        this.setError(error);
        this._readOnly = readOnly;
        this._dataAggregator = dataAggregator;
    }

    static createConnection(connection){
        let connectionId = connection && connection.hasOwnProperty('connectionId') ? connection.connectionId : 0;
        if(connectionId === 0){
            connectionId = connection && connection.hasOwnProperty('id') ? connection.id : 0;
        }
        const title = connection && connection.hasOwnProperty('title') ? connection.title : '';
        const description = connection && connection.hasOwnProperty('description') ? connection.description : '';
        const fromConnector = connection && connection.hasOwnProperty('fromConnector') ? {...connection.fromConnector} : null;
        const toConnector = connection && connection.hasOwnProperty('toConnector') ? {...connection.toConnector} : null;
        const fieldBinding = connection && connection.hasOwnProperty('fieldBinding') ? connection.fieldBinding : [];
        const template = connection && connection.hasOwnProperty('template') ? connection.template : null;
        const error = connection && connection.hasOwnProperty('error') ? connection.error : null;
        const readOnly = connection && connection.hasOwnProperty('readOnly') ? connection.readOnly : false;
        const dataAggregator = connection && connection.hasOwnProperty('dataAggregator') ? connection.dataAggregator : [];
        return new CConnection(connectionId, title, description, fromConnector, toConnector, fieldBinding, template, error, readOnly, dataAggregator);
    }

    static duplicateConnection(connection){
        let duplicate;
        if(connection instanceof CConnection){
            duplicate = connection.getObject();
            duplicate.connectionId = duplicate.id;
        }
        return new CConnection(duplicate);
    }

    convertFieldBindingItem(fieldBindingItem){
        if(!(fieldBindingItem instanceof CFieldBinding)) {
            return CFieldBinding.createFieldBinding(fieldBindingItem);
        }
        return fieldBindingItem;
    }

    convertFieldBindingItems(fieldBindingItems){
        let result = [];
        for(let i = 0; i < fieldBindingItems.length; i++){
            result.push(this.convertFieldBindingItem(fieldBindingItems[i]));
        }
        return result;
    }

    convertTemplate(template){
        if(!(template instanceof CTemplate)) {
            return CTemplate.createTemplate(template);
        }
        return template;
    }


    getAllMethods(){
        return [...this.fromConnector.methods, ...this.toConnector.methods];
    }

    getAllOperators(){
        return [...this.fromConnector.operators, ...this.toConnector.operators];
    }

    moveItem(connector, sourceItem, targetLeftItem, mode, shouldDelete = true){
        const result = {
            currentItem: null,
            colorMapping: {},
        }
        if (sourceItem instanceof CMethodItem) {
            if (connector.getConnectorType() === CONNECTOR_FROM) {
                if(shouldDelete){
                    this.removeFromConnectorMethod(sourceItem, true, true);
                    sourceItem.index = '';
                    sourceItem.isDragged = false;
                    connector.setCurrentItem(targetLeftItem);
                    result.currentItem = this.addFromConnectorMethod(sourceItem, mode);
                } else{
                    connector.setCurrentItem(targetLeftItem);
                    result.currentItem = this.addFromConnectorMethod({...sourceItem.getObject(), index: '', color: ''}, mode);
                    result.colorMapping[sourceItem.color] = result.currentItem.color;
                }
            } else {
                if(shouldDelete) {
                    this.removeToConnectorMethod(sourceItem, true, true);
                    sourceItem.index = '';
                    sourceItem.isDragged = false;
                    connector.setCurrentItem(targetLeftItem);
                    result.currentItem = this.addToConnectorMethod(sourceItem, mode);
                } else{
                    connector.setCurrentItem(targetLeftItem);
                    result.currentItem = this.addToConnectorMethod({...sourceItem.getObject(), index: '', color: ''}, mode);
                    result.colorMapping[sourceItem.color] = result.currentItem.color;
                }
            }
            return result;
        }
        if (sourceItem instanceof COperatorItem) {
            sourceItem.isDragged = false;
            const sourceItemData = sourceItem.getObjectForConnectionOverview();
            sourceItemData.index = '';
            connector.setCurrentItem(targetLeftItem);
            if (connector.getConnectorType() === CONNECTOR_FROM) {
                result.currentItem = this.addFromConnectorOperator(sourceItemData, mode);
            } else {
                result.currentItem = this.addToConnectorOperator(sourceItemData, mode);
            }
            const newIndex = connector.generateNextIndex(mode, targetLeftItem);
            connector.updateIndexesForOperator(sourceItem, newIndex, this, shouldDelete);
            if(shouldDelete) {
                if (connector.getConnectorType() === CONNECTOR_FROM) {
                    this.removeFromConnectorOperator(connector.getItemByUniqueIndex(sourceItem.uniqueIndex), true);
                } else {
                    this.removeToConnectorOperator(connector.getItemByUniqueIndex(sourceItem.uniqueIndex), true);
                }
            } else{
                const existedChildren = connector.getOperatorChildren(sourceItem, true);
                const newChildren = connector.getOperatorChildren(result.currentItem, true);
                if(existedChildren.length === newChildren.length){
                    for(let i = 0; i < existedChildren.length; i++){
                        result.colorMapping[existedChildren[i].color] = newChildren[i].color;
                    }
                }
            }
            return result;
        }
        return result;
    }

    isEmpty(){
        return this._fromConnector.methods.length === 0 && this._fromConnector.operators.length === 0 && this._toConnector.methods.length === 0 && this._toConnector.operators.length === 0;
    }

    getMethodByColor(color){
        let index = this.fromConnector.methods.findIndex(m => m.color === color);
        if(index !== -1){
            return this.fromConnector.methods[index];
        } else{
            index = this.toConnector.methods.findIndex(m => m.color === color);
            if(index !== -1){
                return this.toConnector.methods[index];
            } else{
                return null;
            }
        }
    }

    getConnectorByMethodColor(color){
        let index = this.fromConnector.methods.findIndex(m => m.color === color);
        if(index !== -1){
            return this.fromConnector;
        } else{
            index = this.toConnector.methods.findIndex(m => m.color === color);
            if(index !== -1){
                return this.toConnector;
            } else{
                return null;
            }
        }
    }

    getConnectorByType(type){
        if(type === CONNECTOR_FROM){
            return this._fromConnector;
        }
        if(type === CONNECTOR_TO){
            return this._toConnector;
        }
        return null;
    }

    getConnectorByOperatorIndex(operator){
        if(this.fromConnector.operators.findIndex(o => o.index === operator.index) !== -1){
            return this.fromConnector;
        }
        if(this.toConnector.operators.findIndex(o => o.index === operator.index) !== -1){
            return this.toConnector;
        }
        return null;
    }

    getOptionsForMethods(connector, item, settings = {statement: 'leftStatement', isKeyConsidered: true, exceptCurrent: true}){
        let result = [];
        let statement = settings && settings.hasOwnProperty('statement') ? settings.statement : '';
        let isKeyConsidered = settings && settings.hasOwnProperty('isKeyConsidered') ? settings.isKeyConsidered : true;
        let exceptCurrent = settings && settings.hasOwnProperty('exceptCurrent') ? settings.exceptCurrent : true;
        switch(connector.getConnectorType()){
            case CONNECTOR_FROM:
                if(item.index !== '0') {
                    result = connector.getAllPrevMethods(item);
                }
                break;
            case CONNECTOR_TO:
                if(statement === 'rightStatement'){
                    result.push({
                        label: 'No Method',
                        options: [{label: 'No Method', value: null, color: '#ffffff'}]
                    });
                }
                result.push({
                    label: 'From Connector',
                    options: this._fromConnector.getAllPrevMethods(item, isKeyConsidered, exceptCurrent),
                });
                if(item.index !== '0') {
                    result.push({
                        label: 'To Connector',
                        options: connector.getAllPrevMethods(item)
                    });
                }
                break;
        }
        return result;
    }

    resetToEmptyTemplate(){
        this._fromConnector.resetItems();
        this._toConnector.resetItems();
        this._colors = [
            '#FFCFB5', '#C77E7E', '#6477AB', '#98BEC7',
            '#9EC798', '#BFC798', '#E6E6EA', '#F4B6C2',
            '#E41298', '#F0E4E4', '#FE8A71', '#E7EFF6',
            '#5FC798', '#AF28E4', '#A6E6EA', '#E1C798',
            '#1FCFB5', '#F346C2', '#3477AB', '#44BEC7',
            '#5EC798', '#B12798', '#76E6EA', '#84B6C2',
            '#4173AB', '#A0E4E4', '#BE8A71', '#C7EFF6',
            '#DFC798', '#EF3798', '#F6E6EA', '#11C798',
            '#F12FB5', '#C1227E', '#6122AB', '#912EC7',
            '#912798', '#6FC798', '#E123EA', '#277E7E',
            '#B45DE0', '#F456E4', '#328A71', '#31EFF6',
            '#312798', '#F11798', '#A3210A', '#E33798',
            '#1363B0', '#561E7E', '#93CDE0', '#456EC7',
            '#578998', '#687698', '#7543EA', '#8234C2',
            '#977DE0', '#5F3798', '#BF2A71', '#C723F6',
            '#D13298', '#B3CDE0', '#F512EA', '#4F3444',
            '#1FCFB1', '#177EB1', '#1477B1', '#18BEB1',
            '#1EC7B1', '#1FC7B1', '#16E6B1', '#14B6B1',
            '#1412B1', '#10E4B1', '#1E8AB1', '#17EFB1',
            '#1FC7B1', '#1F28B1', '#16E6B1', '#11C7B1',
            '#1FCFB1', '#1346B1', '#1477B1', '#14BEB1',
            '#1EC7B1', '#1127B1', '#16E6B1', '#14B6B1',
            '#1173B1', '#10E4B1', '#1E8AB1', '#17EFB1',
            '#1FC7B1', '#1F37B1', '#16E6B1', '#11C7B1',
            '#112F11', '#112277', '#112231', '#112EF1',
            '#1127B1', '#1FC7B1', '#1123B1', '#177EB1',
            '#145DB1', '#1456B1', '#128AB1', '#11EFB1',
            '#5127B1', '#2117B1', '#A321B1', '#4337B1',
            '#1363B1', '#161EB1', '#13CDB1', '#156EB1',
            '#1789B1', '#1876B1', '#1543B1', '#1234B1',
            '#177DB1', '#1F37B1', '#1F2AB1', '#1723B1',
            '#1132B1', '#13CDB1', '#1512B1', '#1F34B1',];
        this._fieldBinding = [];
        this._allTemplates = [];
    }

    addRestColor(color){
        this._colors.unshift(color);
    }
    removeRestColor(color){
        if(color !== '') {
            let index = this._colors.indexOf(color);
            if (index !== -1) {
                this._colors.splice(index, 1);
            }
        }
    }

    setError(error){
        if(error && error.hasOwnProperty('data') && error.data.hasOwnProperty('connectorId') && error.data.hasOwnProperty('index')){
            let item = this.getItemByConnectorIdAndIndex(error.data.connectorId, error.data.index);
            if(item){
                item.error = {hasError: true, location: error.data.location, message: error.message};
            }
        }
    }

    getItemByConnectorIdAndIndex(connectorId, index){
        let item = null;
        if(this._fromConnector && this._toConnector) {
            let connector = null;
            if(this._fromConnector.id === connectorId){
                connector = this._fromConnector;
            }
            if(this._toConnector.id === connectorId){
                connector = this._toConnector;
            }
            if (connector) {
                item = connector.getMethodByIndex(index);
                if (!item) {
                    item = connector.getOperatorByIndex(index);
                }
            }
        }
        return item;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Connection has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get title(){
        return this._title;
    }

    set title(title){
        this._title = title;
    }

    get description(){
        return this._description;
    }

    set description(description){
        this._description = description;
    }

    get fromConnector(){
        return this._fromConnector;
    }

    set fromConnector(fromConnector){
        this._fromConnector = fromConnector;
        for(let i = 0; i < this._fromConnector.methods.length; i++){
            this.removeRestColor(this._fromConnector.methods[i].color);
        }
    }

    get toConnector(){
        return this._toConnector;
    }

    set toConnector(toConnector){
        this._toConnector = toConnector;
        for(let i = 0; i < this._toConnector.methods.length; i++){
            this.removeRestColor(this._toConnector.methods[i].color);
        }
    }

    get fieldBinding(){
        return this._fieldBinding;
    }

    set fieldBinding(fieldBindingItems){
        this._fieldBinding = this.convertFieldBindingItems(fieldBindingItems);
    }

    addFieldBinding(fieldBinding){
        this.fieldBinding = [...this._fieldBinding, this.convertFieldBindingItem(fieldBinding)];
    }

    get template(){
        return this._template;
    }

    set template(template){
        this._template = this.convertTemplate(template);
    }

    get allTemplates(){
        return this._allTemplates;
    }

    set allTemplates(allTemplates){
        this._allTemplates = allTemplates;
    }

    get readOnly(){
        return this._readOnly;
    }

    set readOnly(readOnly){
        this._readOnly = readOnly;
    }

    get dataAggregator(){
        return this._dataAggregator;
    }

    set dataAggregator(dataAggregator){
        this._dataAggregator = dataAggregator;
    }

    refreshDataAggregator(aggregator){
        const assignedItems = aggregator.assignedItems;
        const allMethods = this.getAllMethods();
        for(let i = 0; i < allMethods.length; i++){
            for(let j = 0; j < assignedItems.length; j++){
                if(allMethods[i].name === assignedItems[j].name){
                    const {assignedItems, ...props} = aggregator;
                    allMethods[i].dataAggregator = props.id;
                }
            }
        }
    }

    addDataAggregator(aggregator){
        this.refreshDataAggregator(aggregator);
        const {assignedItems, ...props} = aggregator;
        this._dataAggregator = [...this._dataAggregator, props];
    }

    updateDataAggregator(aggregator){
        this.refreshDataAggregator(aggregator);
        const {assignedItems, ...props} = aggregator;
        this._dataAggregator = [...this._dataAggregator.map(a => a.id === props.id ? props : a)];
    }

    getAllAggregationsForSelect(){
        return this.dataAggregator.map(o => {return {label: o.name, value: o.id};});
    }

    getCurrentFieldBindingTo(){
        return this._currentFieldBindingTo;
    }

    setCurrentFieldBindingTo(currentFieldBindingTo){
        this._currentFieldBindingTo = currentFieldBindingTo;
    }

    getAllFieldBindingType(connectorType){
        let result = [];
        for(let i = 0; i < this._fieldBinding.length; i++){
            switch(connectorType){
                case CONNECTOR_FROM:
                    if(this._fieldBinding[i].from.length > 0){
                        result.push(...this._fieldBinding[i].from);
                    }
                    break;
                case CONNECTOR_TO:
                    if(this._fieldBinding[i].to.length > 0){
                        result.push(this._fieldBinding[i].to[0]);
                    }
                    break;
            }
        }
        let filteredResult = [];
        for(let i = 0; i < result.length; i++){
            if(filteredResult.findIndex(f => CFieldBinding.compareTwoBindingItems(f, result[i])) === -1) {
                filteredResult.push(result[i]);
            }
        }
        return filteredResult;
    }

    getAllFieldBindingFrom(){
        return this.getAllFieldBindingType(CONNECTOR_FROM);
    }

    getAllFieldBindingTo(){
        return this.getAllFieldBindingType(CONNECTOR_TO);
    }

    getConnectorMethodByColor(color){
        let result = this._fromConnector.getMethodByColor(color);
        if(result === null){
            result = this._toConnector.getMethodByColor(color);
        }
        return result;
    }

    addConnectorMethod(connectorType, method, mode){
        let connector = null;
        switch(connectorType){
            case CONNECTOR_FROM:
                connector = this._fromConnector;
                break;
            case CONNECTOR_TO:
                connector = this._toConnector;
                break;
            default:
                return;
        }
        if(!method.color){
            let color = this._colors.length > 0 ? this._colors[0] : DEFAULT_COLOR;
            this.removeRestColor(color);
            method.color = color;
        }
        return connector.addMethod(method, mode);
    }

    removeConnectorMethod(connectorType, method, withRefactorIndexes = true, withCleanFieldBinding = true){
        let connector = null;
        let bindingItem = {from: [], to: []};
        switch(connectorType){
            case CONNECTOR_FROM:
                connector = this._fromConnector;
                bindingItem.from.push({color: method.color});
                break;
            case CONNECTOR_TO:
                connector = this._toConnector;
                bindingItem.to.push({color: method.color});
                break;
            default:
                return;
        }
        let color = method.color;
        this.addRestColor(color);
        if(withCleanFieldBinding){
            this.cleanFieldBinding(connectorType, bindingItem);
        }
        connector.removeMethod(method, withRefactorIndexes);
    }

    removeConnectorOperator(connectorType, operator, withCleanFieldBinding){
        let connector = null;
        switch(connectorType){
            case CONNECTOR_FROM:
                connector = this._fromConnector;
                break;
            case CONNECTOR_TO:
                connector = this._toConnector;
                break;
            default:
                return;
        }
        let methods = connector.methods;
        let operators = connector.operators;
        for(let i = methods.length - 1; i >= 0; i--){
            let methodIndex = methods[i].index;
            if(methodIndex.substring(0, operator.index.length) === operator.index){
                this.removeConnectorMethod(connectorType, methods[i], false, withCleanFieldBinding);
            }
        }
        for(let i = operators.length - 1; i >= 0; i--){
            let operatorIndex = operators[i].index;
            let subIndex = operatorIndex.substring(0, operator.index.length);
            if(subIndex === operator.index && operatorIndex.length !== operator.index.length){
                connector.removeOperator(operators[i], false);
            }
        }
        connector.removeOperator(operator, true, true);
    }

    addFromConnectorOperator(operator, mode = OUTSIDE_ITEM){
        const newOperator = this.fromConnector.addOperator(operator, mode);
        this.toConnector.shiftXForSvgItems = this.fromConnector.getShiftXOfSvgItems();
        this.toConnector.setSvgItems();
        return newOperator;
    }

    addToConnectorOperator(operator, mode = OUTSIDE_ITEM){
        return this.toConnector.addOperator(operator, mode);
    }

    addFromConnectorMethod(method, mode){
        const newMethod = this.addConnectorMethod(CONNECTOR_FROM, method, mode);
        this.toConnector.shiftXForSvgItems = this.fromConnector.getShiftXOfSvgItems();
        this.toConnector.setSvgItems();
        return newMethod;
    }

    addToConnectorMethod(method, mode){
        return this.addConnectorMethod(CONNECTOR_TO, method, mode);
    }

    removeFromConnectorMethod(method, withRefactorIndexes = true, withCleanFieldBinding = true){
        this.removeConnectorMethod(CONNECTOR_FROM, method, withRefactorIndexes, withCleanFieldBinding);
        this.toConnector.shiftXForSvgItems = this.fromConnector.getShiftXOfSvgItems();
        this.toConnector.setSvgItems();
    }

    removeToConnectorMethod(method, withRefactorIndexes = true, withCleanFieldBinding = true){
        this.removeConnectorMethod(CONNECTOR_TO, method, withRefactorIndexes, withCleanFieldBinding);
    }

    removeFromConnectorOperator(operator, withCleanFieldBinding = true){
        this.removeConnectorOperator(CONNECTOR_FROM, operator, withCleanFieldBinding);
        this.toConnector.shiftXForSvgItems = this.fromConnector.getShiftXOfSvgItems();
        this.toConnector.setSvgItems();
    }

    removeToConnectorOperator(operator, withCleanFieldBinding = true){
        this.removeConnectorOperator(CONNECTOR_TO, operator, withCleanFieldBinding);
    }

    checkIfExistSuchFields(fields, connectorType){
        let result = false;
        switch(connectorType){
            case CONNECTOR_FROM:
                let counter = 0;
                for(let i = 0; i < fields.length; i++) {
                    if(this.checkFieldFormat(fields[i])) {
                        counter++;
                    } else{
                        result = false;
                        break;
                    }
                }
                if(counter === fields.length){
                    result = true;
                }
                break;
        }
        return result;
    }

    checkFieldFormat(value){
        let color = value.color;
        let fieldType = value.field.split('.');
        if(ALL_COLORS.indexOf(color) !== -1
            && this._colors.indexOf(color) === -1
            && (value.type === STATEMENT_REQUEST
            || value.type === STATEMENT_RESPONSE)){
                if(fieldType[0] === RESPONSE_SUCCESS
                    || fieldType[0] === RESPONSE_FAIL){
                    return true;
                }
        }
        return false;
    }

    cleanFieldBinding(connectorType, bindingItem){
        for(let i = this._fieldBinding.length - 1; i >= 0; i--) {
            let item = null;
            let connectorTypeBinding = [];
            switch(connectorType){
                case CONNECTOR_FROM:
                    connectorTypeBinding = this._fieldBinding[i].from;
                    item = bindingItem.from[0];
                    break;
                case CONNECTOR_TO:
                    connectorTypeBinding = this._fieldBinding[i].to;
                    item = bindingItem.to[0];
                    break;
            }
            if(item !== null) {
                for (let j = connectorTypeBinding.length - 1; j >= 0; j--) {
                    if (CFieldBinding.compareTwoBindingItems(item, connectorTypeBinding[j])) {
                        connectorTypeBinding.splice(j, 1);
                    }
                }
                if ((connectorType === CONNECTOR_FROM && connectorTypeBinding.length === 0)
                ||(this._fieldBinding[i].from.length === 0 && this._fieldBinding[i].to.length === 0)) {
                    this._fieldBinding.splice(i, 1);
                }
            }
        }

        for(let i = this._fieldBinding.length - 1; i >= 0; i--) {
            if (this._fieldBinding[i].to.length === 0) {
                this._fieldBinding.splice(i, 1);
            }
        }
    }

    removeDuplicatesFromFieldBinding(){
        this.fieldBinding = this.fieldBinding.filter((binding1, index, self) => {
            return self.findIndex(binding2 => {
                let checkFrom = binding1.from.length === binding2.from.length;
                if(checkFrom) {
                    for (let i = 0; i < binding1.from.length; i++) {
                        checkFrom = CFieldBinding.compareTwoBindingItems(binding1.from[i], binding2.from[i]);
                        if(!checkFrom){
                            break;
                        }
                    }
                }
                let checkTo = false;
                if(checkFrom){
                    checkTo = binding1.to.length === binding2.to.length;
                    for (let i = 0; i < binding1.to.length; i++) {
                        checkTo = CFieldBinding.compareTwoBindingItems(binding1.to[i], binding2.to[i]);
                        if(!checkTo){
                            break;
                        }
                    }
                }
                return checkFrom && checkTo;
            }) === index;
        })
    }

    updateFieldBinding(connectorType, bindingItem){
        let newFieldBinding = null;
        let hasFound = false;
        switch(connectorType){
            case CONNECTOR_FROM:
                for(let i = 0; i < this._fieldBinding.length; i++){
                    if(this._fieldBinding[i].from.length > 0){
                        if(CFieldBinding.compareTwoBindingItems(this._fieldBinding[i].from[0], bindingItem.from[0])){
                            if(this.checkIfExistSuchFields(bindingItem.to, CONNECTOR_FROM)) {
                                this._fieldBinding[i].to = bindingItem.to;
                            } else{
                                this._fieldBinding[i].from = [];
                            }
                            hasFound = true;
                            break;
                        }
                    }
                }
                for(let i = 0; i < this._fieldBinding.length; i++) {
                    if (this._fieldBinding[i].to.length === 0 && this._fieldBinding[i].from.length === 1) {
                        this._fieldBinding.splice(i, 1);
                    }
                }
                if(!hasFound){
                    for(let i = 0; i < this._fieldBinding.length; i++) {
                        if(this._fieldBinding[i].to.length === 1 && this._fieldBinding[i].from.length === 0){
                            let index = bindingItem.to.findIndex(b => CFieldBinding.compareTwoBindingItems(b, this._fieldBinding[i].to[0]));
                            if(index !== -1){
                                this._fieldBinding.splice(i, 1);
                            }
                        }
                    }
                    newFieldBinding = CFieldBinding.createFieldBinding({from: bindingItem.from, to: bindingItem.to});
                    this._fieldBinding.push(newFieldBinding);
                    for(let i = 0; i < this._fieldBinding.length; i++) {
                        if(this._fieldBinding[i].to.length === 1 && this._fieldBinding[i].from.length === 0){
                            let index = bindingItem.to.findIndex(b => CFieldBinding.compareTwoBindingItems(b, this._fieldBinding[i].to[0]));
                            if(index !== -1){
                                this._fieldBinding.splice(i, 1);
                            }
                        }
                    }
                }
                for(let i = this._fieldBinding.length - 1; i >= 0; i--) {
                    if (this._fieldBinding[i].from.length === 0) {
                        this._fieldBinding.splice(i, 1);
                    }
                }
                break;
            case CONNECTOR_TO:
                for(let i = 0; i < this._fieldBinding.length; i++){
                    if(this._fieldBinding[i].to.length > 0){
                        if(CFieldBinding.compareTwoBindingItems(this._fieldBinding[i].to[0], bindingItem.to[0])){
                            if(this.checkIfExistSuchFields(bindingItem.from, CONNECTOR_FROM)) {
                                this._fieldBinding[i].from = bindingItem.from;
                            } else{
                                this._fieldBinding[i].to = [];
                            }
                            hasFound = true;
                            break;
                        }
                    }
                }
                for(let i = 0; i < this._fieldBinding.length; i++) {
                    if (this._fieldBinding[i].from.length === 0 && this._fieldBinding[i].to.length === 1) {
                        this._fieldBinding.splice(i, 1);
                    }
                }
                if(!hasFound){
                    for(let i = 0; i < this._fieldBinding.length; i++) {
                        if(this._fieldBinding[i].from.length === 1 && this._fieldBinding[i].to.length === 0){
                            let index = bindingItem.from.findIndex(b => CFieldBinding.compareTwoBindingItems(b, this._fieldBinding[i].from[0]));
                            if(index !== -1){
                                this._fieldBinding.splice(i, 1);
                            }
                        }
                    }
                    newFieldBinding = CFieldBinding.createFieldBinding({from: bindingItem.from, to: bindingItem.to});
                    this._fieldBinding.push(newFieldBinding);
                    for(let i = 0; i < this._fieldBinding.length; i++) {
                        if(this._fieldBinding[i].from.length === 1 && this._fieldBinding[i].to.length === 0){
                            let index = bindingItem.from.findIndex(b => CFieldBinding.compareTwoBindingItems(b, this._fieldBinding[i].from[0]));
                            if(index !== -1){
                                this._fieldBinding.splice(i, 1);
                            }
                        }
                    }
                }
                for(let i = this._fieldBinding.length - 1; i >= 0; i--) {
                    if (this._fieldBinding[i].to.length === 0) {
                        this._fieldBinding.splice(i, 1);
                    }
                }
                break;
        }
    }

    getEnhancementByTo(){
        let enhancement = null;
        for(let i = 0; i < this._fieldBinding.length; i++){
            if(this._fieldBinding[i].to.length === 1){
                if(CFieldBinding.compareTwoBindingItems(this._fieldBinding[i].to[0], this._currentFieldBindingTo)){
                    return enhancement = this._fieldBinding[i].enhancement;
                }
            }
        }
        return enhancement;
    }

    updateEnhancement(enhancement){
        for(let i = 0; i < this._fieldBinding.length; i++){
            if(this._fieldBinding[i].to.length === 1){
                if(CFieldBinding.compareTwoBindingItems(this._fieldBinding[i].to[0], this._currentFieldBindingTo)){
                    this._fieldBinding[i].enhancement = enhancement;
                }
            }
        }
    }

    isItemMethodByIndex(connectorType, index){
        const connector = connectorType === CONNECTOR_FROM ? this._fromConnector : this._toConnector;
        return connector.methods.findIndex(m => m.index === index) !== -1;
    }

    isItemOperatorByIndex (connectorType, index){
        const connector = connectorType === CONNECTOR_FROM ? this._fromConnector : this._toConnector;
        return connector.operators.findIndex(o => o.index === index) !== -1;
    }

    isEmpty(){
        return this.fromConnector.isEmpty() && this.toConnector.isEmpty();
    }

    getObject(){
        let fromConnector = this._fromConnector.getObject();
        let toConnector = this._toConnector.getObject();
        let fieldBinding = [];
        for (let i = 0; i < this._fieldBinding.length; i++){
            if(this._fieldBinding[i].from.length > 0 && this._fieldBinding[i].to.length > 0) {
                fieldBinding.push(this._fieldBinding[i].getObject());
            }
        }
        let obj = {
            title: this._title,
            description: this._description,
            fromConnector,
            toConnector,
            fieldBinding,
            dataAggregator: this._dataAggregator,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }

    getObjectForBackend(){
        let data = this.getObject();
        return{
            ...data,
        }
    }

    getFieldBindingsByMethod(method){
        const result = [];
        for(let i = 0; i < this.fieldBinding.length; i++){
            if(this.fieldBinding[i].to[0].color === method.color){
                result.push(this.fieldBinding[i]);
            }
        }
        return result;
    }

    getObjectForConnectionOverview(){
        return{
            ...this.getObject(),
            fromConnector: this._fromConnector.getObjectForConnectionOverview(),
            toConnector: this._toConnector.getObjectForConnectionOverview(),
            template: this.template.getObject(),
            readOnly: this._readOnly,
        }
    }
}
