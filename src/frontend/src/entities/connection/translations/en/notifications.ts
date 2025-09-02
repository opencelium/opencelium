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

import ActionCreators from "../../redux_toolkit/action_creators";
import {
    getAndUpdateConnectionTitle,
    getAndUpdateConnectionDescription,
    getAllMetaConnectionsByInvokerName
} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import { syncInvokers } from "@entity/connection/redux_toolkit/slices/EditorSlice";
import { requestRemoteApi } from "@entity/connection/redux_toolkit/action_creators/EditorCreators";
import {notifyAboutNewSupportFile} from "@root/redux_toolkit/slices/SupportFileSlice";
import {copyLogContentToClipboard} from "@root/redux_toolkit/slices/ConnectionLogSlice";

const {
    testConnection, addConnection,
    updateConnection, deleteConnectionById,
    deleteConnectionsById, getConnectionById,
    getAllMetaConnections, getAllConnections,
    checkConnectionTitle, graphQLLogin,
    generateLogs, deleteSupportFile,
    deleteSupportFiles, downloadSupportFile,
} = ActionCreators;

export default {
    fulfilled: {
        [copyLogContentToClipboard.type]: "The log info was copied.",
        [deleteSupportFile.fulfilled.type]: "The support file was successfully deleted.",
        [deleteSupportFiles.fulfilled.type]: "The support files were successfully deleted.",
        [downloadSupportFile.fulfilled.type]: "The support files was successfully downloaded.",
        [generateLogs.fulfilled.type]: "Support file generation has started.",
        [testConnection.fulfilled.type]: "Test run was successfully triggered",
        [addConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully added",
        [updateConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully updated",
        [getAndUpdateConnectionTitle.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully updated",
        [getAndUpdateConnectionDescription.fulfilled.type]: "The connection description was successfully updated",
        [deleteConnectionById.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully removed",
        [deleteConnectionsById.fulfilled.type]: "The selected connections were successfully removed",
        [syncInvokers.type]: "Synchronized successfully",
        [notifyAboutNewSupportFile.type]: "The new <1><0>{{title}}</0></1> was generated.",
        [requestRemoteApi.fulfilled.type]: "The test request was successfully fulfilled",
    },
    rejected: {/*
        [requestRemoteApi.rejected.type]: {
            "__DEFAULT__": "There is an error during the test of the method"
        },*/
        [deleteSupportFile.rejected.type]: {
            "__DEFAULT__": "There is an error deleting support file."
        },
        [deleteSupportFiles.rejected.type]: {
            "__DEFAULT__": "There is an error deleting support files."
        },
        [downloadSupportFile.rejected.type]: {
            "__DEFAULT__": "There is an error downloading the support file."
        },
        [generateLogs.rejected.type]: {
            "__DEFAULT__": "Could not start generation of the support file."
        },
        [testConnection.rejected.type]: {
            "__DEFAULT__": "There is an error in during the test of the connection"
        },
        [checkConnectionTitle.rejected.type]: {
            "__DEFAULT__": "There is an error in checking uniqueness of the title."
        },
        [getConnectionById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching connection."
        },
        [getAllConnections.rejected.type]: {
            "__DEFAULT__": "There is an error fetching connections."
        },
        [getAllMetaConnections.rejected.type]: {
            "__DEFAULT__": "There is an error fetching connections."
        },
        [addConnection.rejected.type]: {
            "__DEFAULT__": "The connection was not added"
        },
        [updateConnection.rejected.type]: {
            "__DEFAULT__": "The connection was not updated"
        },
        [getAndUpdateConnectionTitle.rejected.type]: {
            "__DEFAULT__": "The connection was not updated"
        },
        [getAndUpdateConnectionDescription.rejected.type]: {
            "__DEFAULT__": "The connection was not updated"
        },
        [deleteConnectionById.rejected.type]: {
            "__DEFAULT__": "The connection was not removed"
        },
        [deleteConnectionsById.rejected.type]: {
            "__DEFAULT__": "The selected connections were not removed"
        },
        [graphQLLogin.rejected.type]: "GraphQL was not connected",
        [getAllMetaConnectionsByInvokerName.rejected.type]: {
            "__DEFAULT__": "The connections was not fetched."
        }
    },
}
