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

import {putAsterixInEmptyBrackets} from "@change_component/form_elements/form_connection/form_svg/utils";

/**
 * Binding Item class for Connection FieldBinding object
 */
export default class CBindingItem{

    constructor(color = '', field = '', type = ''){
        this._color = color;
        this._field = putAsterixInEmptyBrackets(field);
        this._type = type;
    }

    static createBindingItem(bindingItem){
        let color = bindingItem && bindingItem.hasOwnProperty('color') ? bindingItem.color : '';
        let field = bindingItem && bindingItem.hasOwnProperty('field') ? bindingItem.field : '';
        let type = bindingItem && bindingItem.hasOwnProperty('type') ? bindingItem.type : '';
        return new CBindingItem(color, field, type);
    }

    get color(){
        return this._color;
    }

    set color(color){
        this._color = color;
    }

    get field(){
        return this._field;
    }

    set field(field){
        this._field = field;
    }

    get type(){
        return this._type;
    }

    set type(type){
        this._type = type;
    }

    getObject(){
        let obj = {
            color: this._color,
            field: this._field,
            type: this._type,
        };
        return obj;
    }
}
