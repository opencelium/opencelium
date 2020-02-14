

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

/**
 * (not used)
 */
export default class Operator{
    constructor(key, type, name, condition, fieldList = null, bodyAction = null, __pointer__){
        this._key = key;
        this._type = type;
        this._name = name;
        this._condition = condition;
        this._fieldList = fieldList;
        this._bodyAction= bodyAction;
        this.___pointer__ = __pointer__;
    }

    get key(){
        return this._key;
    }

    set key(key){
        this._key = key;
    }

    get type(){
        return this._type;
    }

    set type(type){
        this._type = type;
    }

    get name(){
        return this._name;
    }

    set name(name){
        this._name = name;
    }

    get condition(){
        return this._condition;
    }

    set condition(condition){
        this._condition = condition;
    }

    get fieldList(){
        return this._fieldList;
    }

    set fieldList(fieldList){
        this._fieldList = fieldList;
    }

    get bodyAction(){
        return this._bodyAction;
    }

    set bodyAction(bodyAction){
        this._bodyAction = bodyAction;
    }

    get __pointer__(){
        return this.___pointer__;
    }

    set __pointer__(__pointer__){
        this.___pointer__ = __pointer__;
    }

    getObject(){
        return{
            key: this._key,
            type: this._type,
            name: this._name,
            condition: this._condition,
            fieldList: this._fieldList,
            bodyAction: this._bodyAction,
            __pointer__: this.___pointer__,
        };
    }
}