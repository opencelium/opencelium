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

const METHOD_TYPE = 'method';


/**
 * (not used)
 */
export default class Method{
    constructor(key, name, fieldList = null, __pointer__, hasParent = false){
        this._key = key;
        this._type = METHOD_TYPE;
        this._name = name;
        this._fieldList = fieldList;
        this.___pointer__ = __pointer__;
        this._hasParent = hasParent;
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

    get fieldList(){
        return this._fieldList;
    }

    set fieldList(fieldList){
        this._fieldList = fieldList;
    }

    get __pointer__(){
        return this.___pointer__;
    }

    set __pointer__(__pointer__){
        this.___pointer__ = __pointer__;
    }

    get hasParent(){
        return this._hasParent;
    }

    set hasParent(hasParent){
        this._hasParent = hasParent;
    }

    getObject(){
        return{
            key: this._key,
            type: this._type,
            name: this._name,
            fieldList: this._fieldList,
            __pointer__: this.___pointer__,
            hasParent: this._hasParent,
        };
    }
}