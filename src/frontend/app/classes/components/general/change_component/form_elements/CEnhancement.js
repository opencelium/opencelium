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

import {checkAndDoParam, consoleLog} from '../../../../../utils/app';


/**
 * class Enhancement for manipulating data in the Enhancement Component
 */
export default class Enhancement{
    constructor(id = 0, name, description, simpleCode, expertVariables, expertCode, language = 'js'){
        if(id !== 0){
            this._id = checkAndDoParam(null, id, 'id');
        }
        this._name = checkAndDoParam(null, name, 'string');
        this._description = checkAndDoParam(null, description, 'string');
        this._simpleCode = checkAndDoParam(null, simpleCode, 'object');
        this._expertVariables = checkAndDoParam(null, expertVariables, 'string');
        this._expertCode = checkAndDoParam(null, expertCode, 'string');
        this._language = checkAndDoParam(null, language, 'string');
    }

    static createModule(enhancement){
        let id = enhancement && enhancement.hasOwnProperty('id') ? enhancement.id : 0;
        let name = enhancement && enhancement.hasOwnProperty('name') ? enhancement.name : '';
        let description = enhancement && enhancement.hasOwnProperty('description') ? enhancement.description : '';
        let simpleCode = enhancement && enhancement.hasOwnProperty('simpleCode') ? enhancement.simpleCode : null;
        let expertVariables = enhancement && enhancement.hasOwnProperty('expertVariables') ? enhancement.expertVariables : '';
        let expertCode = enhancement && enhancement.hasOwnProperty('expertCode') ? enhancement.expertCode : '';
        return new Enhancement(id, name, description, simpleCode, expertVariables, expertCode);
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog('CEnhancement has undefined \'id\'');
            return -1;
        }
        return this._id;
    }

    set id(id){
        if(this.hasOwnProperty('_id'))
            this._id = id;
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

    get simpleCode(){
        return this._simpleCode;
    }

    set simpleCode(simpleCode){
        this._simpleCode = simpleCode;
    }

    get expertVariables(){
        return this._expertVariables;
    }

    set expertVariables(expertVariables){
        this._expertVariables = expertVariables;
    }

    get expertCode(){
        return this._expertCode;
    }

    set expertCode(expertCode){
        this._expertCode = expertCode;
    }

    get language(){
        return this._language;
    }

    set language(language){
        this._language = language;
    }

    getObject(){
        return{
            enhanceId: this._id,
            name: this._name,
            description: this._description,
            simpleCode: this._simpleCode,
            expertVar: this._expertVariables,
            expertCode: this._expertCode,
            language: this._language,
        };
    }
}