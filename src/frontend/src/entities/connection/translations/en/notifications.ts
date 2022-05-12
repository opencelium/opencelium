import ActionCreators from "../../redux_toolkit/action_creators";

const {addConnection, updateConnection, deleteConnectionById, deleteConnectionsById, getConnectionById, getAllMetaConnections, getAllConnections, checkConnectionTitle, graphQLLogin} = ActionCreators;

export default {
    fulfilled: {
        [addConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully added",
        [updateConnection.fulfilled.type]: "The connection <1><0>{{title}}</0></1> was successfully updated",
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
        [updateConnection.rejected.type]: "The connection was not updated",
        [deleteConnectionById.rejected.type]: {
            "__DEFAULT__": "The connection was not removed"
        },
        [deleteConnectionsById.rejected.type]: {
            "__DEFAULT__": "The selected connections were not removed"
        },
        [graphQLLogin.rejected.type]: "GraphQL was not connected",
    },
}