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
import {isString} from "@utils/app";
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";

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