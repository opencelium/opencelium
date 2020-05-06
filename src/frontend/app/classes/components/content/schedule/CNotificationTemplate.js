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

import {consoleLog, isId, isString} from "../../../../utils/app";
import {NO_DATA} from "../../../../utils/constants/app";


/**
 * Notification Template class for Notification module
 */
export default class CNotificationTemplate{
    constructor(id = 0, name = ''){
        if(id !== 0){
            this._id = isId(id) ? id : 0;
        }
        this._name = this.checkName(name) ? name : '';
    }

    static createNotificationTemplate(template){
        let id = template && template.hasOwnProperty('id') ? template.id : 0;
        let name = template && template.hasOwnProperty('name') ? template.name : '';
        return new CNotificationTemplate(id, name);
    }

    checkName(name){
        let result = isString(name);
        if(result){
            return true;
        }
        consoleLog(`Notification Template with id ${this._id ? this._id : 0} has a name that is not string`);
        return false;
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Notification Template has undefined 'id'`);
        } else {
            return this._id;
        }
    }

    get name(){
        return this._name;
    }

    set name(name){
        if(this.checkName(name)) {
            this._name = name;
        }
    }

    getObject(){
        let obj = {
            name: this._name,
        };
        if(this.hasOwnProperty('_id')){
            obj.id = this._id;
        }
        return obj;
    }
}