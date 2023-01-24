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