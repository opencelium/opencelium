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

const {addConnector, deleteConnectorById, updateConnector, testRequestData, uploadConnectorImage, deleteConnectorsById, getConnectorById, getAllConnectors, checkConnectorTitle, deleteConnectorImage} = ActionCreators;

export default {
    fulfilled: {
        [testRequestData.fulfilled.type]: "Successfully tested!",
        [addConnector.fulfilled.type]: "The connector <1><0>{{title}}</0></1> was successfully added",
        [updateConnector.fulfilled.type]: "The connector <1><0>{{title}}</0></1> was successfully updated",
        [uploadConnectorImage.fulfilled.type]: "The image of the connector <1><0>{{title}}</0></1> was successfully uploaded.",
        [deleteConnectorById.fulfilled.type]: "The connector <1><0>{{title}}</0></1> was successfully removed",
        [deleteConnectorsById.fulfilled.type]: "The selected connectors were successfully removed",
    },
    rejected: {
        [testRequestData.rejected.type]: {
            "COMMUNICATION_FAILED": "Connection was failed",
            "__DEFAULT__": "Unsuccessfully tested"
        },
        [addConnector.rejected.type]: {
            "COMMUNICATION_FAILED": "Connection was failed",
            "CONNECTOR_ALREADY_EXISTS": "Connector with such title is already in use",
            "__DEFAULT__": "The connector was not added"
        },
        [updateConnector.rejected.type]: {
            "COMMUNICATION_FAILED": "Connection was failed",
            "CONNECTOR_ALREADY_EXISTS": "Connector with such title is already in use",
            "__DEFAULT__": "The connector was not updated"
        },
        [uploadConnectorImage.rejected.type]: {
            "__DEFAULT__": "The image of the connector was not uploaded."
        },
        [deleteConnectorById.rejected.type]: {
            "__DEFAULT__": "The connector was not removed"
        },
        [deleteConnectorsById.rejected.type]: {
            "__DEFAULT__": "The selected connectors were not removed"
        },
        [getConnectorById.rejected.type]: "There is an error fetching connector.",
        [getAllConnectors.rejected.type]: {
            "__DEFAULT__": "There is an error fetching connectors."
        },
    },
}