import ActionCreators from "../../redux-toolkit/action_creators";

const {
    addUser, updateUser, uploadUserImage, deleteUserById, deleteUsersById, getUserById,
    getAllUsers, checkUserEmail, deleteUserImage, updateUserDetail,
} = ActionCreators;

export default {
    fulfilled: {
        [addUser.fulfilled.type]: "The user <1><0>{{email}}</0></1> was successfully added.",
        [updateUser.fulfilled.type]: "The user <1><0>{{email}}</0></1> was successfully updated.",
        [uploadUserImage.fulfilled.type]: "The image of the user <1><0>{{email}}</0></1> was successfully uploaded.",
        [deleteUserById.fulfilled.type]: "The user <1><0>{{email}}</0></1> was successfully removed.",
        [deleteUsersById.fulfilled.type]: "The selected users were successfully removed.",
        [updateUserDetail.fulfilled.type]: "The settings were successfully updated",
    },
    rejected: {
        [addUser.rejected.type]: {
            "EXISTS": "User with such email is already in use",
            "__DEFAULT__": "The user was not added."
        },
        [updateUser.rejected.type]: {
            "EXISTS": "User with such email is already in use",
            "__DEFAULT__": "The user <1><0>{{email}}</0></1> was not updated."
        },
        [uploadUserImage.rejected.type]: {
            "__DEFAULT__": "The image of the user was not uploaded."
        },
        [deleteUserById.rejected.type]: {
            "__DEFAULT__": "The user was not removed."
        },
        [deleteUsersById.rejected.type]: {
            "__DEFAULT__": "The selected users were not removed."
        },[getUserById.rejected.type]: {
            "__DEFAULT__": "There is an error fetching user."
        },
        [getAllUsers.rejected.type]: {
            "__DEFAULT__": "There is an error fetching users."
        },
        [checkUserEmail.rejected.type]: {
            "__DEFAULT__": "There is an error checking email uniqueness."
        },
        [deleteUserImage.rejected.type]: {
            "__DEFAULT__": "There is an error removing user's image."
        },
        [updateUserDetail.rejected.type]: {
            "__DEFAULT__": "The settings were not updated"
        },
    },
}