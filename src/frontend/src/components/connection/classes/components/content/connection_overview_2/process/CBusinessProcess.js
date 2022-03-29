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

import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";

export class CBusinessProcess extends CProcess{

    constructor(businessProcess) {
        super(businessProcess);
        this._items = businessProcess && businessProcess.hasOwnProperty('items') ? this.convertItems([...businessProcess.items]) : [];
        this._arrows = businessProcess && businessProcess.hasOwnProperty('arrows') ? businessProcess.arrows : [];
    }

    static createBusinessProcess(process){
        return new CBusinessProcess(process);
    }

    getHtmlIdName() {
        return `business_process_${super.getHtmlIdName()}`;
    }

    convertItem(item){
        if(item instanceof CTechnicalProcess || item instanceof CTechnicalOperator){
            return item;
        } else{
            if(item.hasOwnProperty('type')){
                return CTechnicalOperator.createTechnicalOperator(item);
            } else{
                return CTechnicalProcess.createTechnicalProcess(item);
            }
        }
    }

    convertItems(items){
        return [...items.map(item => this.convertItem(item))];
    }

    get items(){
        return this._items;
    }

    set items(items){
        this._items = this.convertItems(items);
    }

    addItem(item){
        this._items.push(this.convertItem(item));
    }

    isExistItem(item){
        return this._items.findIndex(i => i.id === item.id) !== -1;
    }

    removeItem(item){
        let index = this._items.findIndex(i => i.id === item.id);
        if(index !== -1){
            this._items.splice(index, 1);
        }
    }

    get arrows(){
        return this._arrows;
    }

    set arrows(arrows){
        this._arrows = arrows;
    }

    getCreateElementPanelStyles(...args){
        return CBusinessProcess.getCreateElementPanelStyles(...args);
    }

    static getCreateElementPanelStyles(x, y){
        let result = {};
        result.panelItemStyles = {left: `${x}px`, top: `${y}px`};
        result.afterItemLineStyles = {left: `${x + 200}px`, top: `${y + 27}px`};
        result.createIconStyles = {top: `${y + 17}px`, left: `${x + 220}px`};
        return result;
    }

    getObject(){
        let data = super.getObject();
        let objectItems = [];
        if(this._items.length > 0){
            if(this._items[0] instanceof CTechnicalProcess || this._items[0] instanceof CTechnicalOperator){
                for(let i = 0; i < this._items.length; i++){
                    objectItems.push({...this._items[i].getObject()});
                }
            }
        }
        return{
            ...data,
            items: objectItems,
            arrows: this._arrows,
        }
    }

    getObjectForBackend(){
        let data = super.getObjectForBackend();
        let objectItems = [];
        if(this._items.length > 0){
            if(this._items[0] instanceof CTechnicalProcess || this._items[0] instanceof CTechnicalOperator){
                for(let i = 0; i < this._items.length; i++){
                    objectItems.push(this._items[i].id);
                }
            }
        }
        return{
            ...data,
            items: objectItems,
        }
    }
}