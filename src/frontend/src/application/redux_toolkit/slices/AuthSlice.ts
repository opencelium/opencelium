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
import {LoginTOTPResponse} from "@entity/totp/requests/interfaces/ITotp";

export interface AuthState extends ICommonState{
    authUser: IAuthUser,
    isAuth: boolean,
    expTime: number,
    sessionId: string,
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
    sessionId: '',
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
            state.sessionId = '';
        },
        updateAuthUser: (state, action: PayloadAction<IAuthUser>) => {
            state.authUser = action.payload;
        },
        setLoginInfo: (state, action: PayloadAction<any>) => {
            state.sessionId = '';
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.isAuth = true;
            state.authUser = action.payload;
            state.wasAccessDenied = false;
        },
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = '';
        }
    },
    extraReducers: {
        [login.pending.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.START;
            state.sessionId = '';
            state.message = '';
        },
        [login.fulfilled.type]: (state, action: PayloadAction<IAuthUser>) => {
            state.sessionId = '';
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.isAuth = true;
            state.authUser = action.payload;
            state.wasAccessDenied = false;
        },
        [login.rejected.type]: (state, action: PayloadAction<IResponse & LoginTOTPResponse>) => {
            state.logining = API_REQUEST_STATE.ERROR;
            state.sessionId = '';
            if(action.payload.message === 'SESSION_ID_IS_REQUIRED') {
                state.sessionId = action.payload.sessionId;
            }
            state.error = action.payload;
        },
    }
})

export const {
    logout, updateAuthUser,
    setLoginInfo, setSessionId } = authSlice.actions
export default authSlice.reducer;
