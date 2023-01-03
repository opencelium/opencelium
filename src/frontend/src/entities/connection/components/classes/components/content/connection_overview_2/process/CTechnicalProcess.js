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

import CProcess from "@entity/connection/components/classes/components/content/connection_overview_2/process/CProcess";
import CMethodItem from "@entity/connection/components/classes/components/content/connection/method/CMethodItem";

export class CTechnicalProcess extends CProcess{

    constructor(technicalProcess) {
        super(technicalProcess);
        this._connectorType = technicalProcess && technicalProcess.hasOwnProperty('connectorType') ? technicalProcess.connectorType : '';
        this._invoker = technicalProcess && technicalProcess.hasOwnProperty('invoker') ? technicalProcess.invoker : null;
        this._entity = technicalProcess && technicalProcess.hasOwnProperty('entity') ? technicalProcess.entity : null;
        if(!(this._entity instanceof CMethodItem)){
            this._entity = CMethodItem.createMethodItem(this._entity);
        }
    }

    static createTechnicalProcess(process){
        return new CTechnicalProcess(process);
    }

    getHtmlIdName() {
        return `${this._connectorType}__${super.getHtmlIdName()}`;
    }

    get connectorType(){
        return this._connectorType;
    }

    set connectorType(connectorType){
        this._connectorType = connectorType;
    }

    get invoker(){
        return this._invoker;
    }

    set invoker(invoker){
        this._invoker = invoker;
    }

    get entity(){
        return this._entity;
    }

    getCreateElementPanelStyles(...args){
        return CTechnicalProcess.getCreateElementPanelStyles(...args);
    }

    static getCreateElementPanelStyles(x, y, data = {isOnTheTopLayout: false, isTypeCreateOperator: false, noOperatorType: false, hasBeforeItem: false}){
        let result = {};
        let xIntend = data.hasBeforeItem ? 100 : 0;
        let panelItemYIntend = 0;
        if(data.isTypeCreateOperator){
            xIntend += 100;
            panelItemYIntend = 30;
        }
        let panelItemTypeYIntend = 0;
        let itemTypeLineYIntend = 0;
        if(data.isOnTheTopLayout){
            itemTypeLineYIntend = -99;
            y -= 3;
        }
        x -= 30;
        result.itemTypeLine = {top: `${y + 2 + itemTypeLineYIntend}px`, left: `${x - 7}px`};
        result.panelItemTypeStyles = {top: `${y + 2 + panelItemTypeYIntend}px`, left: `${x + 11}px`};
        result.beforeItemLineStyles = {top: `${y + 34}px`, left: `${x + 111}px`};
        result.panelItemStyles = {top: `${y - 24 + panelItemYIntend}px`, left: `${x + xIntend + 30}px`};
        result.afterItemLineStyles = {top: `${y + 34}px`, left: `${x + xIntend + 230}px`};
        result.createIconStyles = {top: `${y + 23}px`, left: `${x + xIntend + 250}px`};
        if(data && data.noOperatorType){
            result.panelItemTypeStyles.top = `${y + 17}px`;
        }
        return result;
    }

    getObject(){
        let data = super.getObject();
        return{
            ...data,
            connectorType: this._connectorType,
            invoker: this._invoker,
            entity: this._entity.getObjectForSvgElement(),
        }
    }
}