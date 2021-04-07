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

import COperator from "@classes/components/content/connection_overview_2/operator/COperator";

export class CTechnicalOperator extends COperator{

    constructor(businessOperator) {
        super(businessOperator);
        this._items = businessOperator && businessOperator.hasOwnProperty('items') ? businessOperator.items : [];
        this._arrows = businessOperator && businessOperator.hasOwnProperty('arrows') ? businessOperator.arrows : [];
    }

    static createTechnicalOperator(operator){
        return new CTechnicalOperator(operator);
    }

    get items(){
        return this._items;
    }

    set items(items){
        this._items = items;
    }

    get arrows(){
        return this._arrows;
    }

    set arrows(arrows){
        this._arrows = arrows;
    }

    getObject(){
        let data = super.getObject();
        return{
            ...data,
            items: this._items,
            arrows: this._arrows,
        }
    }
}