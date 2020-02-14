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


import {consoleLog, isId} from "../../../../../utils/app";

/**
 * (not used)
 */
export default class CEnhancement{

    constructor(enhancementId = 0, name = '', description = '', language = 'js', simpleCode = null, expertVar = '', expertCode = ''){
        if(enhancementId !== 0){
            this._id = isId(enhancementId) ? enhancementId : 0;
        }
        this._name = name;
        this._description = description;
        this._language = language;
        this._simpleCode = simpleCode;
        this._expertVar = expertVar;
        this._expertCode = expertCode;
    }

    static createEnhancement(enhancement){
        let enhancementId = enhancement && enhancement.hasOwnProperty('enhancementId') ? enhancement.enhancementId : 0;
        let name = enhancement && enhancement.hasOwnProperty('name') ? enhancement.name : '';
        let description = enhancement && enhancement.hasOwnProperty('description') ? enhancement.description : '';
        let language = enhancement && enhancement.hasOwnProperty('language') ? enhancement.language : 'js';
        let simpleCode = enhancement && enhancement.hasOwnProperty('simpleCode') ? enhancement.simpleCode : null;
        let expertVar = enhancement && enhancement.hasOwnProperty('expertVar') ? enhancement.expertVar : '';
        let expertCode = enhancement && enhancement.hasOwnProperty('expertCode') ? enhancement.expertCode : '';
        return new CEnhancement(enhancementId, name, description, language, simpleCode, expertVar, expertCode);
    }

    get id(){
        if(!this.hasOwnProperty('_id')){
            consoleLog(`Enhancement has undefined 'id'`);
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

    get language(){
        return this._language;
    }

    set language(language){
        this._language = language;
    }

    get simpleCode(){
        return this._simpleCode;
    }

    set simpleCode(simpleCode){
        this._simpleCode = simpleCode;
    }

    get expertVar(){
        return this._expertVar;
    }

    set expertVar(expertVar){
        this._expertVar = expertVar;
    }

    get expertCode(){
        return this._expertCode;
    }

    set expertCode(expertCode){
        this._expertCode = expertCode;
    }

    getObject(){
        let obj = {
            name: this._name,
            description: this._description,
            language: this._language,
            simpleCode: this._simpleCode,
            expertVar: this._expertVar,
            expertCode: this._expertCode,
        };
        return obj;
    }
}