/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import ActionCreators from "../../redux_toolkit/action_creators";
import {getAndUpdateConnection} from "@root/redux_toolkit/action_creators/ConnectionCreators";

const {addConnection, updateConnection, deleteConnectionById, deleteConnectionsById, getConnectionById, getAllMetaConnections, getAllConnections, checkConnectionTitle, graphQLLogin} = ActionCreators;

export default {
    fulfilled: {
        [addConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully added",
        [updateConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully updated",
        [getAndUpdateConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully updated",
        [deleteConnectionById.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully removed",
        [deleteConnectionsById.fulfilled.type]: "The selected connections were successfully removed",
    },
    rejected: {
        [getConnectionById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching connection."
        },
        [getAllConnections.rejected.type]: {
            "__DEFAULT__": "There is an error fetching connections."
        },
        [addConnection.rejected.type]: "The connection was not added",
        [updateConnection.rejected.type]: {
            "__DEFAULT__": "The connection was not updated"
        },
        [getAndUpdateConnection.rejected.type]: {
            "__DEFAULT__": "The connection was not updated"
        },
        [deleteConnectionById.rejected.type]: {
            "__DEFAULT__": "The connection was not removed"
        },
        [deleteConnectionsById.rejected.type]: {
            "__DEFAULT__": "The selected connections were not removed"
        },
        [graphQLLogin.rejected.type]: "GraphQL was not connected",
    },
}