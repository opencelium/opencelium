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
import {ICommonState} from "@application/interfaces/core";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {getDefaultConfig, testConfig} from "@entity/ldap/redux_toolkit/action_creators/LdapCreators";
import LdapConfigModel from "@entity/ldap/requests/models/LdapConfigModel";
import {isArray} from "@application/utils/utils";

export interface MigrationState extends ICommonState{
    gettingDefaultConfig: API_REQUEST_STATE,
    testingConfig: API_REQUEST_STATE,
    defaultConfig: LdapConfigModel,
    debugLogs: string[],
}

const initialState: MigrationState = {
    gettingDefaultConfig: API_REQUEST_STATE.INITIAL,
    testingConfig: API_REQUEST_STATE.INITIAL,
    defaultConfig: null,
    debugLogs: [],
    ...CommonState,
}

export const ldapSlice = createSlice({
    name: 'ldap',
    initialState,
    reducers: {
        clearDebugLogs: (state) => {
            state.debugLogs = [];
        },
    },
    extraReducers: {
        [getDefaultConfig.pending.type]: (state) => {
            state.gettingDefaultConfig = API_REQUEST_STATE.START;
        },
        [getDefaultConfig.fulfilled.type]: (state, action: PayloadAction<LdapConfigModel>) => {
            state.gettingDefaultConfig = API_REQUEST_STATE.FINISH;
            state.defaultConfig = action.payload;
            state.error = null;
        },
        [getDefaultConfig.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingDefaultConfig = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [testConfig.pending.type]: (state) => {
            state.testingConfig = API_REQUEST_STATE.START;
        },
        [testConfig.fulfilled.type]: (state, action: PayloadAction<string[]>) => {
            state.testingConfig = API_REQUEST_STATE.FINISH;
            state.debugLogs = action.payload;
            state.error = null;
        },
        [testConfig.rejected.type]: (state, action: PayloadAction<string[]>) => {
            state.testingConfig = API_REQUEST_STATE.ERROR;
            if (isArray(action.payload)) {
                state.debugLogs = action.payload;
            } else {
                state.error = action.payload;
            }
        },
    }
})

export const {
    clearDebugLogs,
} = ldapSlice.actions;

export default ldapSlice.reducer;
