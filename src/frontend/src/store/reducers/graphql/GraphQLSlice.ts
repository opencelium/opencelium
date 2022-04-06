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
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {CommonState} from "../../store";
import {ICommonState} from "@interface/application/core";
import {IResponse} from "@requestInterface/application/IResponse";
import {graphQLLogin} from "@action/graphql/GraphQLCreators";

export interface GraphQLState extends ICommonState{
    authStatus: string,
    accessToken: string,
    refreshToken: string,
    logining: API_REQUEST_STATE,
}
const initialState: GraphQLState = {
    authStatus: '',
    accessToken: '',
    refreshToken: '',
    logining: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const graphQLSlice = createSlice({
    name: 'graphql',
    initialState,
    reducers: {},
    extraReducers: {
        [graphQLLogin.pending.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.START;
        },
        [graphQLLogin.fulfilled.type]: (state, action: PayloadAction<any>) => {
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.accessToken = action.payload.data.authentication.login.accessToken;
            state.refreshToken = action.payload.data.authentication.login.refreshToken;
            state.authStatus = action.payload.data.authentication.login.status;
        },
        [graphQLLogin.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.logining = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default graphQLSlice.reducer;