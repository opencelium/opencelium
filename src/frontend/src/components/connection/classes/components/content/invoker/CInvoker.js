


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

import COperation, {METHOD_TYPE_TEST} from "./COperation";
import CXml from "../xml/CXml";

/**
 * Class Invoker
 */
export default class CInvoker{

    constructor(name = '', description = '', hint = '', icon = '', data = [], auth = '', operations = []){
        this._name = name;
        this._description = description;
        this._hint = hint;
        this._icon = icon;
        this._data = data;
        this._auth = auth;
        this._operations = this.convertOperations(operations);
    }

    static createInvoker(invoker){
        let name = invoker && invoker.hasOwnProperty('name') ? invoker.name : '';
        let description = invoker && invoker.hasOwnProperty('description') ? invoker.description : '';
        let hint = invoker && invoker.hasOwnProperty('hint') ? invoker.hint : '';
        let icon = invoker && invoker.hasOwnProperty('icon') ? invoker.icon : '';
        let data = invoker && invoker.hasOwnProperty('requiredData') ? invoker.requiredData : '';
        let auth = invoker && invoker.hasOwnProperty('authType') ? invoker.authType : '';
        let operations = invoker && invoker.hasOwnProperty('operations') ? invoker.operations : [];
        return new CInvoker(name, description, hint, icon, data, auth, operations);
    }

    convertOperations(operations){
        let result = [];
        for(let i = 0; i < operations.length; i++){
            result.push(this.convertOperation(operations[i]));
        }
        return result;
    }

    convertOperation(operation){
        if(!(operation instanceof COperation)) {
            return COperation.createOperation({...operation});
        }
        return operation;
    }

    checkConnection(connection){
        return connection.type === METHOD_TYPE_TEST;
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get description(){
        return this._description;
    }

    set description(description){
        this._description = description;
    }

    get hint(){
        return this._hint;
    }

    set hint(hint){
        this._hint = hint;
    }

    get icon(){
        return this._icon;
    }

    set icon(icon){
        this._icon = icon;
    }

    get data(){
        return this._data;
    }

    set data(data){
        this._data = data;
    }

    get auth(){
        return this._auth;
    }

    set auth(auth){
        this._auth = auth;
    }

    set connection(connection){
        if(this.checkConnection(connection)) {
            let index = this._operations.findIndex(o => o.type === METHOD_TYPE_TEST);
            this._operations[index] = connection;
        }
    }

    get connection(){
        let connection = this._operations.find(o => o.type === METHOD_TYPE_TEST);
        if(!connection){
            this._operations.push(COperation.createOperation({type: METHOD_TYPE_TEST}));
            return this._operations[0];
        }
        return connection;
    }

    get operations(){
        return this._operations;
    }

    getOperationsWithoutConnection(){
        return this._operations.filter(o => o.type !== METHOD_TYPE_TEST);
    }

    getAllOperationsForSelect(){
        return this._operations.map(o => {return {label: o.name, value: o.name};});
    }

    addOperation(operation){
        this._operations.push(this.convertOperation(operation));
    }

    replaceOperation(operation){
        let index = this._operations.findIndex(o => o.name === operation.name);
        if(index !== -1){
            this._operations[index] = this.convertOperation(operation);
        }
    }

    set operations(operations){
        this._operations = this.convertOperations(operations);
    }

    getXml(){
        let xml = CXml.createXml({className: 'invoker', element: this});
        return xml.generateXmlString();
    }

    getObject(){
        let operations = [];
        for (let i = 0; i < this._operations.length; i++){
            operations.push(this._operations[i].getObject());
        }
        let obj = {
            name: this._name,
            description: this._description,
            hint: this._hint,
            icon: this._icon,
            data: this._data,
            auth: this._auth,
            operations,
        };
        return obj;
    }
}