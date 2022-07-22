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

import ActionCreators from "../../redux-toolkit/action_creators";

const {
    addUser, updateUser, uploadUserImage, deleteUserById, deleteUsersById, getUserById,
    getAllUsers, checkUserEmail, updateUserDetail,
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
        [updateUserDetail.rejected.type]: {
            "__DEFAULT__": "The settings were not updated"
        },
    },
}