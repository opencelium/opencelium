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
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {ICommonState} from "@application/interfaces/core";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {graphQLLogin} from "../action_creators/GraphQLCreators";

export interface GraphQLState extends ICommonState{
    authStatus: string,
    accessToken: string,
    logining: API_REQUEST_STATE,
}
const initialState: GraphQLState = {
    authStatus: '',
    accessToken: '',
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
        [graphQLLogin.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.logining = API_REQUEST_STATE.FINISH;
            state.error = null;
            state.accessToken = action.payload;
        },
        [graphQLLogin.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.logining = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default graphQLSlice.reducer;
