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

import {consoleLog} from "@application/utils/utils";
import CComponent from "./CComponent";
import {isId} from "@application/utils/utils";

/**
 * UserGroup class
 */
export default class CUserGroup{

    constructor(id = 0, role = '', description = '', icon = '', components = []){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._role = role;
        this._description = description;
        this._icon = icon;
        this._components = this.convertComponents(components);
    }

    static createUserGroup(userGroup){
        let id = userGroup && userGroup.hasOwnProperty('groupId') ? userGroup.groupId : '';
        let role = userGroup && userGroup.hasOwnProperty('name') ? userGroup.name : '';
        let description = userGroup && userGroup.hasOwnProperty('description') ? userGroup.description : '';
        let icon = userGroup && userGroup.hasOwnProperty('icon') ? userGroup.icon : '';
        let components = userGroup && userGroup.hasOwnProperty('components') ? userGroup.components : '';
        return new CUserGroup(id, role, description, icon, components);
    }

    convertComponents(component){
        let result = [];
        for(let i = 0; i < component.length; i++){
            result.push(this.convertComponent(component[i]));
        }
        return result;
    }

    convertComponent(component){
        if(!(component instanceof CComponent)) {
            return CComponent.createComponent(component);
        }
        return component;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`UserGroup has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get role(){
        return this._role;
    }

    set role(role){
        this._role = role;
    }

    get description(){
        return this._description;
    }

    set description(description){
        this._description = description;
    }

    get icon(){
        return this._icon;
    }

    set icon(icon){
        this._icon = icon;
    }

    get components(){
        return this._components;
    }

    set components(components){
        this._components = this.convertComponents(components);
    }

    getObject(){
        let obj = {
            name: this._role,
            description: this._description,
            icon: this._icon,
            components: this._components,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}