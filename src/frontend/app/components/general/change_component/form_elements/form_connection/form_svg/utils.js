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

import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CBusinessOperator} from "@classes/components/content/connection_overview_2/operator/CBusinessOperator";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import CConnection from "@classes/components/content/connection/CConnection";

export function mapItemsToClasses(state){
    const connectionOverview = state.get('connection_overview');
    let currentBusinessItem = connectionOverview.get('currentBusinessItem');
    let connection = connectionOverview.get('connection');
    connection = CConnection.createConnection(connection);
    const updateConnection = connectionOverview.get('updateConnection');
    if(currentBusinessItem !== null && (!(currentBusinessItem instanceof CBusinessProcess) || !(currentBusinessItem instanceof CBusinessOperator))){
        if(currentBusinessItem.hasOwnProperty('type')){
            currentBusinessItem = CBusinessOperator.createBusinessOperator(currentBusinessItem);
        } else{
            currentBusinessItem = CBusinessProcess.createBusinessProcess(currentBusinessItem);
        }
    }
    let currentTechnicalItem = connectionOverview.get('currentTechnicalItem');
    if(currentTechnicalItem !== null && (!(currentTechnicalItem instanceof CTechnicalProcess) || !(currentTechnicalItem instanceof CTechnicalOperator))){
        if(currentTechnicalItem.hasOwnProperty('type')){
            currentTechnicalItem = CTechnicalOperator.createTechnicalOperator(currentTechnicalItem);
        } else{
            currentTechnicalItem = CTechnicalProcess.createTechnicalProcess(currentTechnicalItem);
        }
    }
    let items = connectionOverview.get('items').toJS();
    let instancesItems = [];
    if(items.length > 0){
        if(!(items[0] instanceof CBusinessProcess || items[0] instanceof CBusinessOperator)){
            for(let i = 0; i < items.length; i++){
                if(items[i].hasOwnProperty('type')){
                    instancesItems.push(CBusinessOperator.createBusinessOperator(items[i]));
                } else{
                    instancesItems.push(CBusinessProcess.createBusinessProcess(items[i]));
                }
            }
        }
    }
    return {
        connectionOverview,
        currentBusinessItem,
        currentTechnicalItem,
        items: instancesItems,
        connection,
        updateConnection,
    }
}