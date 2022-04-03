

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

import {checkReferenceFormat} from "@utils/app";

export default class CProperty{
    constructor(name = '', value = '', parent = null) {
        this._uniqueIndex = `${new Date().getTime()}_${Math.random(10000)}`;
        this._name = name;
        this._value = value;
        this._parent = parent;
        this._isReference = checkReferenceFormat(value, true);
    }

    static createProperty(name, value, parent){
        return new CProperty(name, value, parent);
    }

    update(name, value){
        this._name = name;
        this._value = value;
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get value(){
        return this._value;
    }

    set value(value){
        this._value = value;
        this._isReference = checkReferenceFormat(value, true);
    }

    get uniqueIndex(){
        return this._uniqueIndex;
    }

    get parent(){
        return this._parent;
    }

    get isReference(){
        return this._isReference;
    }

    set isReference(isReference){
        this._isReference = isReference;
    }

    convertToXml(){
        return `${this._name}="${this._value}"`;
    }

    convertToBackendXml(){
        return{
            [this._name]: this._value,
        };
    }
}