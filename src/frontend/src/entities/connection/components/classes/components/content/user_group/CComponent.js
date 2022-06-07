/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import {consoleLog} from "@application/utils/utils";
import {isId} from "@application/utils/utils";

/**
 * Component class for user groups' components
 */
export default class CComponent{

    constructor(id = 0, name = '', description = '', permissions = []){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._name = name;
        this._description = description;
        this._permissions = permissions;
    }

    static createComponent(component){
        let id = component && component.hasOwnProperty('componentId') ? component.componentId : 0;
        let name = component && component.hasOwnProperty('name') ? component.name : '';
        let description = component && component.hasOwnProperty('description') ? component.description : '';
        let permissions = component && component.hasOwnProperty('permissions') ? component.permissions : [];
        return new CComponent(id, name, description, permissions);
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Component has undefined 'id'`);
        } else {
            return this._id;
        }
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

    get permissions(){
        return this._permissions;
    }

    set permissions(permissions){
        this._permissions = permissions;
    }

    getObject(){
        let obj = {
            name: this._name,
            description: this._description,
            permissions: this._permissions,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}