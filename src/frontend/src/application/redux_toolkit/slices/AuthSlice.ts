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
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {API_REQUEST_STATE, TRIPLET_STATE} from "../../interfaces/IApplication";
import {CommonState} from "../../utils/store";
import {ICommonState} from "../../interfaces/core";
import {login} from "../action_creators/AuthCreators";
import {LocalStorage} from "../../classes/LocalStorage";
import {IResponse} from "../../requests/interfaces/IResponse";
import {LogoutProps} from "../../interfaces/IAuth";

export interface AuthState extends ICommonState{
    authUser: IAuthUser,
    isAuth: boolean,
    expTime: number,
    hasLicense: TRIPLET_STATE,
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
    hasLicense: TRIPLET_STATE.INITIAL,
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
            state.hasLicense = TRIPLET_STATE.INITIAL;
        },
        updateAuthUser: (state, action: PayloadAction<IAuthUser>) => {
            state.authUser = action.payload;
        }
    },
    extraReducers: {
        [login.pending.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.START;
            state.message = '';
        },
        [login.fulfilled.type]: (state, action: PayloadAction<IAuthUser>) => {
            state.hasLicense = TRIPLET_STATE.TRUE;
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.isAuth = true;
            state.authUser = action.payload;
            state.wasAccessDenied = false;
        },
        [login.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.logining = API_REQUEST_STATE.ERROR;
            if(action.payload.message === 'NO_LICENSE') {
                state.hasLicense = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
    }
})

export const { logout, updateAuthUser } = authSlice.actions
export default authSlice.reducer;
