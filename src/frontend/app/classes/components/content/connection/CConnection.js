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

import {consoleLog, isId} from "@utils/app";
import CConnectorItem, {CONNECTOR_FROM, CONNECTOR_TO} from "./CConnectorItem";
import CFieldBinding from "./field_binding/CFieldBinding";
import CTemplate from "./CTemplate";
import CBindingItem from "./field_binding/CBindingItem";
import {RESPONSE_FAIL, RESPONSE_SUCCESS} from "../invoker/response/CResponse";
import {STATEMENT_REQUEST, STATEMENT_RESPONSE} from "./operator/CStatement";

const DEFAULT_COLOR = '#ffffff';

export const ALL_COLORS = [
    '#FFCFB5', '#C77E7E', '#6477AB', '#98BEC7',
    '#9EC798', '#BFC798', '#E6E6EA', '#F4B6C2',
    '#B3CDE0', '#F0E4E4', '#FE8A71', '#E7EFF6',
    '#5FC798', '#5F3798', '#A6E6EA', '#E1C798',
];

/**
 * Connection class for manipulating data in the Connection Component
 */
export default class CConnection{

    constructor(connectionId = 0, title = '', description = '', fromConnector = null, toConnector = null, fieldBindingItems = [], template = null, error = null){
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
        this._toConnector = CConnectorItem.createConnectorItem(toConnector);
        this._fieldBinding = this.convertFieldBindingItems(fieldBindingItems);
        this._template = this.convertTemplate(template);
        this._allTemplates = [];
        this._colors = [
            '#FFCFB5', '#C77E7E', '#6477AB', '#98BEC7',
            '#9EC798', '#BFC798', '#E6E6EA', '#F4B6C2',
            '#B3CDE0', '#F0E4E4', '#FE8A71', '#E7EFF6',
            '#5FC798', '#5F3798', '#A6E6EA', '#E1C798',];
        for(let i = 0; i < this._fromConnector.methods.length; i++){
            this.removeRestColor(this._fromConnector.methods[i].color);
        }
        for(let i = 0; i < this._toConnector.methods.length; i++){
            this.removeRestColor(this._toConnector.methods[i].color);
        }
        this._currentFieldBindingTo = -1;
        this.setError(error);
    }

    static createConnection(connection){
        let connectionId = connection && connection.hasOwnProperty('connectionId') ? connection.connectionId : 0;
        let title = connection && connection.hasOwnProperty('title') ? connection.title : '';
        let description = connection && connection.hasOwnProperty('description') ? connection.description : '';
        let fromConnector = connection && connection.hasOwnProperty('fromConnector') ? connection.fromConnector : null;
        let toConnector = connection && connection.hasOwnProperty('toConnector') ? connection.toConnector : null;
        let fieldBinding = connection && connection.hasOwnProperty('fieldBinding') ? connection.fieldBinding : [];
        let template = connection && connection.hasOwnProperty('template') ? connection.template : null;
        let error = connection && connection.hasOwnProperty('error') ? connection.error : null;
        return new CConnection(connectionId, title, description, fromConnector, toConnector, fieldBinding, template, error);
    }

    convertBindingItem(bindingItem){
        if(!(bindingItem instanceof CBindingItem) || bindingItem === null) {
            return CBindingItem.createBindingItem(bindingItem);
        }
        return bindingItem;
    }

    convertFieldBindingItem(fieldBindingItem){
        if(!(fieldBindingItem instanceof CFieldBinding) || fieldBindingItem === null) {
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
        if(!(template instanceof CTemplate) || template === null) {
            return CTemplate.createTemplate(template);
        }
        return template;
    }

    isEmpty(){
        return this._fromConnector.methods.length === 0 && this._fromConnector.operators.length === 0 && this._toConnector.methods.length === 0 && this._toConnector.operators.length === 0;
    }

    getOptionsForMethods(connector, item, settings = {statement: 'leftStatement', isKeyConsidered: true, exceptCurrent: true}){
        let result = [];
        let statement = settings && settings.hasOwnProperty('statement') ? settings.statement : '';
        let isKeyConsidered = settings && settings.hasOwnProperty('isKeyConsidered') ? settings.isKeyConsidered : true;
        let exceptCurrent = settings && settings.hasOwnProperty('exceptCurrent') ? settings.exceptCurrent : true;
        switch(connector.getConnectorType()){
            case CONNECTOR_FROM:
                result = connector.getAllPrevMethods(item);
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
                result.push({
                    label: 'To Connector',
                    options: connector.getAllPrevMethods(item)
                });
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
            '#B3CDE0', '#F0E4E4', '#FE8A71', '#E7EFF6',
            '#5FC798', '#5F3798', '#A6E6EA', '#E1C798',];
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
        let color = this._colors.length > 0 ? this._colors[0] : DEFAULT_COLOR;
        this.removeRestColor(color);
        method.color = color;
        connector.addMethod(method, mode);
    }

    removeConnectorMethod(connectorType, method, withRefactorIndexes = true){
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
        this.cleanFieldBinding(connectorType, bindingItem);
        connector.removeMethod(method, withRefactorIndexes);
    }

    removeConnectorOperator(connectorType, operator){
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
                this.removeConnectorMethod(connectorType, methods[i], false);
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

    addFromConnectorMethod(method, mode){
        this.addConnectorMethod(CONNECTOR_FROM, method, mode);
    }

    addToConnectorMethod(method, mode){
        this.addConnectorMethod(CONNECTOR_TO, method, mode);
    }

    removeFromConnectorMethod(method, withRefactorIndexes = true){
        this.removeConnectorMethod(CONNECTOR_FROM, method, withRefactorIndexes);
    }

    removeToConnectorMethod(method, withRefactorIndexes = true){
        this.removeConnectorMethod(CONNECTOR_TO, method, withRefactorIndexes);
    }

    removeFromConnectorOperator(operator){
        this.removeConnectorOperator(CONNECTOR_FROM, operator);
    }

    removeToConnectorOperator(operator){
        this.removeConnectorOperator(CONNECTOR_TO, operator);
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

    updateFieldBinding(connectorType, bindingItem){
        let newFieldBinding = null;
        switch(connectorType){
            case CONNECTOR_FROM:
                newFieldBinding = CFieldBinding.createFieldBinding({from: [this.convertBindingItem(bindingItem)]});
                this._fieldBinding.push(newFieldBinding);
                break;
            case CONNECTOR_TO:
                let hasFound = false;
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
            fromConnector: fromConnector,
            toConnector: toConnector,
            fieldBinding: fieldBinding,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}