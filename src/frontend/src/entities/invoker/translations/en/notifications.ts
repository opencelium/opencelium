import ActionCreators from "../../redux_toolkit/action_creators";

const {
    importInvoker, addInvoker, updateInvoker, uploadInvokerImage, deleteInvokerByName,
    deleteInvokersByName, getAllInvokers, checkInvokerName, deleteInvokerImage, getInvokerByName,
    updateOperation,
} = ActionCreators;

export default {
    fulfilled: {
        [addInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully added.",
        [importInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully imported.",
        [deleteInvokerByName.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully removed",
        [deleteInvokersByName.fulfilled.type]: "The selected invokers were successfully removed",
        [updateInvoker.fulfilled.type]: "The invoker <1><0>{{name}}</0></1> was successfully updated",
        [uploadInvokerImage.fulfilled.type]: "The image of the invoker <1><0>{{name}}</0></1> was successfully uploaded.",
    },
    rejected: {
        [updateOperation.rejected.type]: {
            "__DEFAULT__": "The invoker operation was not updated"
        },
        [getInvokerByName.rejected.type]: {
            "__DEFAULT__": "There is an error fetching invoker."
        },
        [getAllInvokers.rejected.type]: {
            "__DEFAULT__": "There is an error fetching invokers."
        },
        [addInvoker.rejected.type]: {
            "__DEFAULT__": "The invoker was not added."
        },
        [importInvoker.rejected.type]: {
            "__DEFAULT__": "The invoker was not imported."
        },
        [deleteInvokerByName.rejected.type]: {
            "__DEFAULT__": "The invoker was not removed"
        },
        [deleteInvokersByName.rejected.type]: {
            "__DEFAULT__": "The selected invokers were not removed"
        },
        [updateInvoker.rejected.type]: {
            "__DEFAULT__": "The invoker was not updated"
        },
        [uploadInvokerImage.rejected.type]: {
            "__DEFAULT__": "The image of the invoker was not uploaded."
        },
    },
}