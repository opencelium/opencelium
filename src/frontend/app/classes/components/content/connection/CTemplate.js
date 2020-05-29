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

import {consoleLog} from "@utils/app";

export const EXPERT_MODE = 'expert';
export const TEMPLATE_MODE = 'template';

/**
 * Template class for manipulating data in the Template of Connection
 */
export default class CTemplate{

    constructor(mode = EXPERT_MODE, templateId = -1, label = ''){
        this._mode = this.checkMode(mode) ? mode : '';
        this._templateId = templateId;
        this._label = label;
    }

    static createTemplate(templateData){
        let mode = templateData && templateData.hasOwnProperty('mode') ? templateData.mode : EXPERT_MODE;
        let templateId = templateData && templateData.hasOwnProperty('templateId') ? templateData.templateId : -1;
        let label = templateData && templateData.hasOwnProperty('label') ? templateData.label : '';
        return new CTemplate(mode, templateId, label);
    }

    checkMode(mode){
        if(mode === EXPERT_MODE || mode === TEMPLATE_MODE){
            return true;
        }
        consoleLog('Wrong mode for the the template');
        return false;
    }

    get mode(){
        return this._mode;
    }

    set mode(mode){
        this._mode = this.checkMode(mode) ? mode : '';
    }

    get templateId(){
        return this._templateId;
    }

    set templateId(templateId){
        this._templateId = templateId;
    }

    get label(){
        return this._label;
    }

    set label(label){
        this._label = label;
    }

    getObject(){
        let obj = {
            mode: this._mode,
            templateId: this._templateId,
            label: this._label,
        };
        return obj;
    }
}