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


import CEnhancement from "./CEnhancement";
import CBindingItem from "./CBindingItem";

/**
 * (not used)
 */
export default class CFieldBinding{

    constructor(from = [], to = [], enhancement = {}){
        this._from = CFieldBinding.convertBindingItems(from);
        this._to = CFieldBinding.convertBindingItems(to);
        this._enhancement = this.convertEnhancement(enhancement);
    }

    static createFieldBinding(fieldBinding){
        let from = fieldBinding && fieldBinding.hasOwnProperty('from') ? fieldBinding.from : [];
        let to = fieldBinding && fieldBinding.hasOwnProperty('to') ? fieldBinding.to : [];
        let enhancement = fieldBinding && fieldBinding.hasOwnProperty('enhancement') ? fieldBinding.enhancement : {};
        return new CFieldBinding(from, to, enhancement);
    }


    convertEnhancement(enhancement){
        if(!(enhancement instanceof CEnhancement)) {
            return CEnhancement.createEnhancement({...enhancement, fieldBinding: this});
        }
        return CEnhancement.createEnhancement({...enhancement.getObject(), fieldBinding: this});
    }

    static convertBindingItem(item){
        if(!(item instanceof CBindingItem)) {
            return CBindingItem.createBindingItem(item);
        }
        return item;
    }

    static convertBindingItems(items){
        let result = [];
        for(let i = 0; i < items.length; i++){
            result.push(this.convertBindingItem(items[i]));
        }
        return result;
    }

    static compareTwoBindingItems(bindingItem1, bindingItem2){
        bindingItem1 = this.convertBindingItem(bindingItem1);
        bindingItem2 = this.convertBindingItem(bindingItem2);
        if((bindingItem1.field === '' && bindingItem1.type === '') || (bindingItem2.field === '' && bindingItem2.type === '')){
            return bindingItem1.color === bindingItem2.color;
        }
        return bindingItem1.field === bindingItem2.field && bindingItem1.color === bindingItem2.color && bindingItem1.type === bindingItem2.type;
    }

    get from(){
        return this._from;
    }

    set from(from){
        this._from = CFieldBinding.convertBindingItems(from);
        this._enhancement.updateExpertVar();
    }

    get to(){
        return this._to;
    }

    set to(to){
        this._to = CFieldBinding.convertBindingItems(to);
        this._enhancement.updateExpertVar();
    }

    get enhancement(){
        return this._enhancement;
    }

    set enhancement(enhancement){
        this._enhancement = this.convertEnhancement(enhancement);
    }

    getObject(){
        let from = [];
        for (let i = 0; i < this._from.length; i++){
            from.push(this._from[i].getObject());
        }
        let to = [];
        for (let i = 0; i < this._to.length; i++){
            to.push(this._to[i].getObject());
        }
        let obj = {
            from: from,
            to: to,
            enhancement: this._enhancement.getObject(),
        };
        return obj;
    }
}