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

import COperator from "@entity/connection/components/classes/components/content/connection_overview_2/operator/COperator";

export class CTechnicalOperator extends COperator{

    constructor(technicalOperator) {
        super(technicalOperator);
        this._items = technicalOperator && technicalOperator.hasOwnProperty('items') ? technicalOperator.items : [];
        this._arrows = technicalOperator && technicalOperator.hasOwnProperty('arrows') ? technicalOperator.arrows : [];
    }

    static createTechnicalOperator(operator){
        return new CTechnicalOperator(operator);
    }

    getHtmlIdName() {
        return `${this._connectorType}__${super.getHtmlIdName()}`;
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

    getCreateElementPanelStyles(...args){
        return CTechnicalOperator.getCreateElementPanelStyles(...args);
    }

    static getCreateElementPanelStyles(x, y, data = {isOnTheTopLayout: false, isTypeCreateOperator:  false, noOperatorType: false, isOnlyOneCreateElement: false}){
        let result = {};
        let panelItemYIntend = data && data.isTypeCreateOperator ? 0 : 28;
        let panelItemTypeYIntend = 0;
        let itemTypeLineYIntend = 0;
        result.itemTypeLine = {top: `${y + 27 + itemTypeLineYIntend}px`, left: `${x + 112}px`};
        result.panelItemTypeStyles = {top: `${y - 5 + panelItemTypeYIntend}px`, left: `${x + 130}px`};
        result.beforeItemLineStyles = {top: `${y + 27}px`, left: `${x + 230}px`};
        result.panelItemStyles = {top: `${y - 3 - panelItemYIntend}px`, left: `${x + 250}px`};
        result.afterItemLineStyles = {top: `${y + 27}px`, left: `${x + 450}px`};
        result.createIconStyles = {top: `${y + 17}px`, left: `${x + 468}px`};
        if(data.isOnlyOneCreateElement){
            result.panelItemStyles = {top: `${y - 3 - panelItemYIntend}px`, left: `${x - 5}px`};
            result.afterItemLineStyles = {top: `${y + 27}px`, left: `${x + 195}px`};
            result.createIconStyles = {top: `${y + 14}px`, left: `${x + 213}px`};
        }
        if(data && data.noOperatorType){
            result.panelItemTypeStyles.top = `${y + 17}px`;
        }
        return result;
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