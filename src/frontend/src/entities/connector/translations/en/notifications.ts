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