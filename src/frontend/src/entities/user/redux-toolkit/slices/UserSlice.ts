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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {ICommonState} from "@application/interfaces/core";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {
    addUser,
    checkUserEmail,
    deleteUserById,
    deleteUsersById,
    getAllUsers,
    getUserById,
    updateUser, uploadUserImage
} from "../action_creators/UserCreators";
import ModelUser from "../../requests/models/User";

export interface UserState extends ICommonState{
    users: ModelUser[],
    isCurrentUserHasUniqueEmail: TRIPLET_STATE,
    checkingUserEmail: API_REQUEST_STATE,
    addingUser: API_REQUEST_STATE,
    updatingUser: API_REQUEST_STATE,
    gettingUser: API_REQUEST_STATE,
    gettingUsers: API_REQUEST_STATE,
    deletingUserById: API_REQUEST_STATE,
    deletingUsersById: API_REQUEST_STATE,
    uploadingUserImage: API_REQUEST_STATE,
    deletingUserImage: API_REQUEST_STATE,
    currentUser: ModelUser,
}

const initialState: UserState = {
    users: [],
    isCurrentUserHasUniqueEmail: TRIPLET_STATE.INITIAL,
    checkingUserEmail: API_REQUEST_STATE.INITIAL,
    addingUser: API_REQUEST_STATE.INITIAL,
    updatingUser: API_REQUEST_STATE.INITIAL,
    gettingUser: API_REQUEST_STATE.INITIAL,
    gettingUsers: API_REQUEST_STATE.INITIAL,
    deletingUserById: API_REQUEST_STATE.INITIAL,
    deletingUsersById: API_REQUEST_STATE.INITIAL,
    uploadingUserImage: API_REQUEST_STATE.INITIAL,
    deletingUserImage: API_REQUEST_STATE.INITIAL,
    currentUser: null,
    ...CommonState,
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkUserEmail.pending.type]: (state) => {
            state.checkingUserEmail = API_REQUEST_STATE.START;
            state.isCurrentUserHasUniqueEmail = TRIPLET_STATE.INITIAL;
        },
        [checkUserEmail.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingUserEmail = API_REQUEST_STATE.FINISH;
            state.isCurrentUserHasUniqueEmail = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkUserEmail.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingUserEmail = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addUser.pending.type]: (state) => {
            state.addingUser = API_REQUEST_STATE.START;
            state.isCurrentUserHasUniqueEmail = TRIPLET_STATE.INITIAL;
        },
        [addUser.fulfilled.type]: (state, action: PayloadAction<ModelUser>) => {
            state.addingUser = API_REQUEST_STATE.FINISH;
            state.users.push(action.payload);
            state.error = null;
        },
        [addUser.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingUser = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.EXISTS){
                state.isCurrentUserHasUniqueEmail = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [updateUser.pending.type]: (state) => {
            state.updatingUser = API_REQUEST_STATE.START;
        },
        [updateUser.fulfilled.type]: (state, action: PayloadAction<ModelUser>) => {
            state.error = null;
            state.updatingUser = API_REQUEST_STATE.FINISH;
            state.users = state.users.map(user => user.userId === action.payload.userId ? action.payload : user);
        },
        [updateUser.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingUser = API_REQUEST_STATE.ERROR;
            if(action.payload.message === ResponseMessages.EXISTS){
                state.isCurrentUserHasUniqueEmail = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [getUserById.pending.type]: (state) => {
            state.currentUser = null;
            state.isCurrentUserHasUniqueEmail = TRIPLET_STATE.INITIAL;
            state.checkingUserEmail = API_REQUEST_STATE.INITIAL;
            state.gettingUser = API_REQUEST_STATE.START;
        },
        [getUserById.fulfilled.type]: (state, action: PayloadAction<ModelUser>) => {
            state.gettingUser = API_REQUEST_STATE.FINISH;
            state.currentUser = action.payload;
            state.error = null;
        },
        [getUserById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingUser = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllUsers.pending.type]: (state) => {
            state.gettingUsers = API_REQUEST_STATE.START;
            state.isCurrentUserHasUniqueEmail = TRIPLET_STATE.INITIAL;
            state.checkingUserEmail = API_REQUEST_STATE.INITIAL;
        },
        [getAllUsers.fulfilled.type]: (state, action: PayloadAction<ModelUser[]>) => {
            state.gettingUsers = API_REQUEST_STATE.FINISH;
            state.users = action.payload;
            state.error = null;
        },
        [getAllUsers.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingUsers = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteUserById.pending.type]: (state) => {
            state.deletingUserById = API_REQUEST_STATE.START;
        },
        [deleteUserById.fulfilled.type]: (state, action: PayloadAction<number>) => {
            state.deletingUserById = API_REQUEST_STATE.FINISH;
            state.users = state.users.filter(user => user.userId !== action.payload);
            if(state.currentUser && state.currentUser.userId === action.payload){
                state.currentUser = null;
            }
            state.error = null;
        },
        [deleteUserById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingUserById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteUsersById.pending.type]: (state) => {
            state.deletingUsersById = API_REQUEST_STATE.START;
        },
        [deleteUsersById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.deletingUsersById = API_REQUEST_STATE.FINISH;
            state.users = state.users.filter(user => action.payload.findIndex(id => `${id}` === `${user.userId}`) === -1);
            if(state.currentUser && action.payload.findIndex(id => `${id}` === `${state.currentUser.userId}`) !== -1){
                state.currentUser = null;
            }
            state.error = null;
        },
        [deleteUsersById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingUsersById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [uploadUserImage.pending.type]: (state) => {
            state.uploadingUserImage = API_REQUEST_STATE.START;
        },
        [uploadUserImage.fulfilled.type]: (state, action: PayloadAction<ModelUser>) => {
            state.uploadingUserImage = API_REQUEST_STATE.FINISH;
            state.users = state.users.map(user => user.userId === action.payload.userId ? action.payload : user);
            if(state.currentUser && state.currentUser.userId === action.payload.userId){
                state.currentUser = action.payload;
            }
            state.error = null;
        },
        [uploadUserImage.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingUserImage = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default userSlice.reducer;