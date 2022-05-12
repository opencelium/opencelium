import ActionCreators from "../../redux_toolkit/action_creators";

const {addUserGroup, updateUserGroup, uploadUserGroupImage, deleteUserGroupById, deleteUserGroupsById, getUserGroupById, getAllUserGroups, checkUserGroupName, deleteUserGroupImage} = ActionCreators;

export default {
    fulfilled: {
        [addUserGroup.fulfilled.type]: "The user group <1><0>{{name}}</0></1> was successfully added.",
        [updateUserGroup.fulfilled.type]: "The user group <1><0>{{name}}</0></1> was successfully updated.",
        [uploadUserGroupImage.fulfilled.type]: "The image of the user group <1><0>{{name}}</0></1> was successfully uploaded.",
        [deleteUserGroupById.fulfilled.type]: "The user group <1><0>{{name}}</0></1> was successfully removed.",
        [deleteUserGroupsById.fulfilled.type]: "The selected user groups were successfully removed.",
    },
    rejected: {
        [addUserGroup.rejected.type]: {
            "EXISTS": "User Group with such name is already in use",
            "__DEFAULT__": "The user group was not added."
        },
        [updateUserGroup.rejected.type]: {
            "EXISTS": "User Group with such name is already in use",
            "__DEFAULT__": "The user group was not updated."
        },
        [uploadUserGroupImage.rejected.type]: {
            "__DEFAULT__": "The image of the user group was not uploaded."
        },
        [deleteUserGroupById.rejected.type]: {
            "__DEFAULT__": "The user group was not removed."
        },
        [deleteUserGroupsById.rejected.type]: {
            "__DEFAULT__": "The selected user groups were not removed."
        },
        [getUserGroupById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching user group."
        },
        [getAllUserGroups.rejected.type]: {
            "__DEFAULT__": "There is an error fetching user groups."
        },
    },
}