/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import {
    addUserGroup,
    checkUserGroupName,
    deleteUserGroupById,
    deleteUserGroupImage,
    deleteUserGroupsById,
    getAllUserGroups,
    getUserGroupById,
    updateUserGroup,
    uploadUserGroupImage
} from "@action/UserGroupCreators";
import {IResponse, ResponseMessages} from "@requestInterface/application/IResponse";
import {CommonState} from "../store";
import {ICommonState} from "@interface/application/core";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";

export interface UserGroupState extends ICommonState{
    userGroups: IUserGroup[],
    isCurrentUserGroupHasUniqueName: TRIPLET_STATE,
    checkingUserGroupName: API_REQUEST_STATE,
    addingUserGroup: API_REQUEST_STATE,
    updatingUserGroup: API_REQUEST_STATE,
    gettingUserGroup: API_REQUEST_STATE,
    gettingUserGroups: API_REQUEST_STATE,
    deletingUserGroupById: API_REQUEST_STATE,
    deletingUserGroupsById: API_REQUEST_STATE,
    uploadingUserGroupImage: API_REQUEST_STATE,
    deletingUserGroupImage: API_REQUEST_STATE,
    currentUserGroup: IUserGroup,
}

const initialState: UserGroupState = {
    userGroups: [],
    isCurrentUserGroupHasUniqueName: TRIPLET_STATE.INITIAL,
    checkingUserGroupName: API_REQUEST_STATE.INITIAL,
    addingUserGroup: API_REQUEST_STATE.INITIAL,
    updatingUserGroup: API_REQUEST_STATE.INITIAL,
    gettingUserGroup: API_REQUEST_STATE.INITIAL,
    gettingUserGroups: API_REQUEST_STATE.INITIAL,
    deletingUserGroupById: API_REQUEST_STATE.INITIAL,
    deletingUserGroupsById: API_REQUEST_STATE.INITIAL,
    uploadingUserGroupImage: API_REQUEST_STATE.INITIAL,
    deletingUserGroupImage: API_REQUEST_STATE.INITIAL,
    currentUserGroup: null,
    ...CommonState,
}

export const userGroupSlice = createSlice({
    name: 'userGroup',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkUserGroupName.pending.type]: (state) => {
            state.checkingUserGroupName = API_REQUEST_STATE.START;
        },
        [checkUserGroupName.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingUserGroupName = API_REQUEST_STATE.FINISH;
            state.isCurrentUserGroupHasUniqueName = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkUserGroupName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingUserGroupName = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addUserGroup.pending.type]: (state, action: PayloadAction<IUserGroup>) => {
            state.addingUserGroup = API_REQUEST_STATE.START;
        },
        [addUserGroup.fulfilled.type]: (state, action: PayloadAction<IUserGroup>) => {
            state.addingUserGroup = API_REQUEST_STATE.FINISH;
            state.userGroups.push(action.payload);
            state.error = null;
        },
        [addUserGroup.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingUserGroup = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.EXISTS){
                state.isCurrentUserGroupHasUniqueName = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [updateUserGroup.pending.type]: (state) => {
            state.updatingUserGroup = API_REQUEST_STATE.START;
        },
        [updateUserGroup.fulfilled.type]: (state, action: PayloadAction<IUserGroup>) => {
            state.updatingUserGroup = API_REQUEST_STATE.FINISH;
            state.userGroups = state.userGroups.map(userGroup => userGroup.groupId === action.payload.groupId ? action.payload : userGroup);
            if(state.currentUserGroup && state.currentUserGroup.groupId === action.payload.groupId){
                state.currentUserGroup = action.payload;
            }
            state.error = null;
        },
        [updateUserGroup.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingUserGroup = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.EXISTS){
                state.isCurrentUserGroupHasUniqueName = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [getUserGroupById.pending.type]: (state) => {
            state.checkingUserGroupName = API_REQUEST_STATE.INITIAL;
            state.isCurrentUserGroupHasUniqueName = TRIPLET_STATE.INITIAL;
            state.gettingUserGroup = API_REQUEST_STATE.START;
            state.currentUserGroup = null;
        },
        [getUserGroupById.fulfilled.type]: (state, action: PayloadAction<IUserGroup>) => {
            state.gettingUserGroup = API_REQUEST_STATE.FINISH;
            state.currentUserGroup = action.payload;
            state.error = null;
        },
        [getUserGroupById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingUserGroup = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllUserGroups.pending.type]: (state) => {
            state.checkingUserGroupName = API_REQUEST_STATE.INITIAL;
            state.isCurrentUserGroupHasUniqueName = TRIPLET_STATE.INITIAL;
            state.gettingUserGroups = API_REQUEST_STATE.START;
            state.currentUserGroup = null;
        },
        [getAllUserGroups.fulfilled.type]: (state, action: PayloadAction<IUserGroup[]>) => {
            state.gettingUserGroups = API_REQUEST_STATE.FINISH;
            state.userGroups = action.payload;
            state.error = null;
        },
        [getAllUserGroups.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingUserGroups = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteUserGroupById.pending.type]: (state) => {
            state.deletingUserGroupById = API_REQUEST_STATE.START;
        },
        [deleteUserGroupById.fulfilled.type]: (state, action: PayloadAction<number>) => {
            state.deletingUserGroupById = API_REQUEST_STATE.FINISH;
            state.userGroups = state.userGroups.filter(userGroup => userGroup.groupId !== action.payload);
            if(state.currentUserGroup && state.currentUserGroup.groupId === action.payload){
                state.currentUserGroup = null;
            }
            state.error = null;
        },
        [deleteUserGroupById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingUserGroupById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteUserGroupsById.pending.type]: (state) => {
            state.deletingUserGroupsById = API_REQUEST_STATE.START;
        },
        [deleteUserGroupsById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.deletingUserGroupsById = API_REQUEST_STATE.FINISH;
            state.userGroups = state.userGroups.filter(userGroup => action.payload.findIndex(id => id === userGroup.groupId) === -1);
            if(state.currentUserGroup && action.payload.findIndex(id => id === state.currentUserGroup.groupId) !== -1){
                state.currentUserGroup = null;
            }
            state.error = null;
        },
        [deleteUserGroupsById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingUserGroupsById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [uploadUserGroupImage.pending.type]: (state) => {
            state.uploadingUserGroupImage = API_REQUEST_STATE.START;
        },
        [uploadUserGroupImage.fulfilled.type]: (state, action: PayloadAction<IUserGroup>) => {
            state.uploadingUserGroupImage = API_REQUEST_STATE.FINISH;
            state.userGroups = state.userGroups.map(userGroup => userGroup.groupId === action.payload.groupId ? action.payload : userGroup);
            if(state.currentUserGroup && state.currentUserGroup.groupId === action.payload.id){
                state.currentUserGroup = action.payload;
            }
            state.error = null;
        },
        [uploadUserGroupImage.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingUserGroupImage = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteUserGroupImage.pending.type]: (state) => {
            state.deletingUserGroupImage = API_REQUEST_STATE.START;
        },
        [deleteUserGroupImage.fulfilled.type]: (state, action: PayloadAction<IUserGroup>) => {
            state.deletingUserGroupImage = API_REQUEST_STATE.FINISH;
            state.userGroups = state.userGroups.map(userGroup => userGroup.groupId === action.payload.groupId ? action.payload : userGroup);
            if(state.currentUserGroup && state.currentUserGroup.groupId === action.payload.id){
                state.currentUserGroup = action.payload;
            }
            state.error = null;
        },
        [deleteUserGroupImage.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingUserGroupImage = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default userGroupSlice.reducer;