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
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {API_REQUEST_STATE} from "../../interfaces/IApplication";
import {CommonState} from "../../utils/store";
import {ICommonState} from "../../interfaces/core";
import {login, updateAuthUserDetail} from "../action_creators/AuthCreators";
import {LocalStorage} from "../../classes/LocalStorage";
import {IResponse} from "../../requests/interfaces/IResponse";
import {LogoutProps} from "../../interfaces/IAuth";

export interface AuthState extends ICommonState{
    authUser: IAuthUser,
    isAuth: boolean,
    expTime: number,
    updatingAuthUser: API_REQUEST_STATE,
    logining: API_REQUEST_STATE,
    logouting: API_REQUEST_STATE,
    isSessionExpired: boolean,
    wasAccessDenied: boolean,
}
const storage = LocalStorage.getStorage(true);
const authUser: IAuthUser = storage.get('authUser');
const initialState: AuthState = {
    authUser: authUser || null,
    isAuth: !!authUser,
    expTime: authUser ? authUser.expTime : 0,
    updatingAuthUser: API_REQUEST_STATE.INITIAL,
    logining: API_REQUEST_STATE.INITIAL,
    logouting: API_REQUEST_STATE.INITIAL,
    isSessionExpired: true,
    wasAccessDenied: false,
    ...CommonState,
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state, action: PayloadAction<LogoutProps>) => {
            state.logouting = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.isAuth = false;
            state.authUser = null;
            state.wasAccessDenied = action.payload?.wasAccessDenied || false;
            state.message = action.payload?.message || '';
        }
    },
    extraReducers: {
        [updateAuthUserDetail.pending.type]: (state) => {
            state.updatingAuthUser = API_REQUEST_STATE.START;
        },
        [updateAuthUserDetail.fulfilled.type]: (state, action: PayloadAction<IAuthUser>) => {
            state.updatingAuthUser = API_REQUEST_STATE.FINISH;
            if(state.authUser && state.authUser.id === action.payload.id){
                state.authUser = {...action.payload};
            }
            state.error = null;
        },
        [updateAuthUserDetail.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingAuthUser = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [login.pending.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.START;
            state.message = '';
        },
        [login.fulfilled.type]: (state, action: PayloadAction<IAuthUser>) => {
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.isAuth = true;
            state.authUser = action.payload;
            state.wasAccessDenied = false;
        },
        [login.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.logining = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const { logout } = authSlice.actions
export default authSlice.reducer;