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

import {CBodyEditor} from "@classes/components/general/basic_components/CBodyEditor";

export class CJsonEditor extends CBodyEditor{
    static getPlaceholder(){
        return '{ ... }';
    }

    static getClassName(params = {isDraft: false}){
        return params.isDraft ? 'method_body_draft' : 'method_body';
    }

    static hasImport(){
        return true;
    }

    static isAbsolute(){
        return true;
    }

    static getParent(textarea = null){
        return textarea && textarea.id ? document.getElementById(textarea.id) : document.activeElement;
    }

    static convertToBodyFormat(bodyData){
        return bodyData.updated_src;
    }

    static convertForFieldBinding(reactJson){
        if(reactJson) {
            return {
                namespaces: reactJson.namespace,
                newValue: reactJson.new_value,
                name: reactJson.name,
                existingValue: reactJson.existing_value,
            };
        }
        return null;
    }
}