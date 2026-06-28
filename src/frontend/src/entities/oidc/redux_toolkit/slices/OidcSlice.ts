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
import {getOidcConfig} from "@entity/oidc/redux_toolkit/action_creators/OidcCreators";
import {IOidcConfig} from "@entity/oidc/requests/interfaces/IOidc";

export interface OidcState extends ICommonState{
    gettingConfig: API_REQUEST_STATE,
    config: IOidcConfig,
}

const initialState: OidcState = {
    gettingConfig: API_REQUEST_STATE.INITIAL,
    config: null,
    ...CommonState,
}

export const oidcSlice = createSlice({
    name: 'oidc',
    initialState,
    reducers: {},
    extraReducers: {
        [getOidcConfig.pending.type]: (state) => {
            state.gettingConfig = API_REQUEST_STATE.START;
        },
        [getOidcConfig.fulfilled.type]: (state, action: PayloadAction<IOidcConfig>) => {
            state.gettingConfig = API_REQUEST_STATE.FINISH;
            state.config = action.payload;
            state.error = null;
        },
        [getOidcConfig.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingConfig = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default oidcSlice.reducer;
