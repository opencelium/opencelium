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

import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {CTechnicalOperator} from "@entity/connection/components/classes/components/content/connection_overview_2/operator/CTechnicalOperator";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";

export function mapItemsToClasses(state, isModal){
    const connectionOverview = state.connectionReducer;
    
    let connection = CConnection.createConnection(Object.assign({}, connectionOverview.connection));
    const updateConnection = connectionOverview.updateConnection;
    let currentTechnicalItem = connectionOverview.currentTechnicalItem;
    if(currentTechnicalItem !== null && (!(currentTechnicalItem instanceof CTechnicalProcess) || !(currentTechnicalItem instanceof CTechnicalOperator))){
        if(currentTechnicalItem.hasOwnProperty('type')){
            currentTechnicalItem = CTechnicalOperator.createTechnicalOperator(currentTechnicalItem);
        } else{
            currentTechnicalItem = CTechnicalProcess.createTechnicalProcess(currentTechnicalItem);
        }
    }
    return {
        connectionOverview,
        currentTechnicalItem,
        connection,
        updateConnection,
    }
}