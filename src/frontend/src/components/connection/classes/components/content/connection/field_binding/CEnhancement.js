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

import {consoleLog, isId} from "@utils/app";

/**
 * Enhancement class for Field Binding class
 */
export default class CEnhancement{

    constructor(enhancementId = 0, name = '', description = '', language = 'js', simpleCode = null, expertVar = '', expertCode = '', fieldBinding = null){
        if(enhancementId !== 0){
            this._id = isId(enhancementId) ? enhancementId : 0;
        }
        this._name = name;
        this._description = description;
        this._language = language;
        this._simpleCode = simpleCode;
        this._fieldBinding = fieldBinding;
        this._expertVar = this.setExpertVar(expertVar);
        this._expertCode = this.setExpertCode(expertCode);
    }

    static createEnhancement(enhancement){
        let enhancementId = enhancement && enhancement.hasOwnProperty('enhancementId') ? enhancement.enhancementId : 0;
        let name = enhancement && enhancement.hasOwnProperty('name') ? enhancement.name : '';
        let description = enhancement && enhancement.hasOwnProperty('description') ? enhancement.description : '';
        let language = enhancement && enhancement.hasOwnProperty('language') ? enhancement.language : 'js';
        let simpleCode = enhancement && enhancement.hasOwnProperty('simpleCode') ? enhancement.simpleCode : null;
        let expertVar = enhancement && enhancement.hasOwnProperty('expertVar') ? enhancement.expertVar : '';
        let expertCode = enhancement && enhancement.hasOwnProperty('expertCode') ? enhancement.expertCode : '';
        let fieldBinding = enhancement && enhancement.hasOwnProperty('fieldBinding') ? enhancement.fieldBinding : null;
        return new CEnhancement(enhancementId, name, description, language, simpleCode, expertVar, expertCode, fieldBinding);
    }

    setExpertVar(expertVar){
        let result = expertVar !== '' ? expertVar : '';
        if(result === ''){
            result = this.getExpertVar();
        }
        return result;
    }
    getVariables(){
        const binding = this._fieldBinding;
        let variables = [];
        let fromFieldName = '';
        let fromFieldType = '';
        let fromFieldColor = '';
        for (let i = 0; i < binding.from.length; i++) {
            fromFieldName = binding.from[i].field;
            fromFieldType = binding.from[i].type;
            fromFieldColor = binding.from[i].color;
            if (fromFieldName !== '') {
                variables.push({name: fromFieldName, value: null, type: fromFieldType, color: fromFieldColor});
            }
        }
        return variables;
    }
    getResultVariable(){
        const binding = this._fieldBinding;
        let variables = this.getVariables();
        let result = {name: '', value: null, type: 'variable'};
        if(binding.to.length > 0) {
            let toFieldName = binding.to[0].field;
            let toFieldType = binding.to[0].type;
            let toFieldColor = binding.to[0].color;
            if (toFieldName !== '') {
                result = {name: toFieldName, value: null, type: toFieldType, color: toFieldColor};
            }
            if (variables.findIndex(v => v.name === result.name) !== -1) {
                result.name = `_to_connector_${result.name}`;
            }
        }
        return result;
    }
    getExpertVar(){
        let result = '';
        if(this._fieldBinding){
            let resultVariable = this.getResultVariable();
            let variables = this.getVariables();
            result = "//";
            result += `var RESULT_VAR = ${resultVariable.color}.(${resultVariable.type}).${resultVariable.name};
`;
            for(let i = 0; i < variables.length; i ++){
                result += "//";
                result += `var VAR_${i} = ${variables[i].color}.(${variables[i].type}).${variables[i].name};`;
                result += i < variables.length - 1 ? `
` : '';
            }
        } else{
            consoleLog('FieldBinding is null in CEnhancement');
        }
        return result;
    }

    setExpertCode(expertCode){
        let result = expertCode !== '' ? expertCode : '';
        if(result === ''){
            result = 'RESULT_VAR = VAR_0;';
        }
        return result;
    }

    updateExpertVar(){
        this._expertVar = this.setExpertVar('');
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