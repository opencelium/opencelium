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
import {getServicePortalTokenStatus} from "@entity/application/redux_toolkit/action_creators/ApplicationCreators";

export interface EntityApplicationState extends ICommonState{
    documentation: any,
    checkingApi: API_REQUEST_STATE,
    updatingLogoData: API_REQUEST_STATE,
    gettingServicePortalStatus: API_REQUEST_STATE,
    servicePortalTokenStatus: boolean,
}

const initialState: EntityApplicationState = {
    documentation: null,
    checkingApi: API_REQUEST_STATE.INITIAL,
    updatingLogoData: API_REQUEST_STATE.INITIAL,
    gettingServicePortalStatus: API_REQUEST_STATE.INITIAL,
    servicePortalTokenStatus: false,
    ...CommonState,
}

export const applicationSlice = createSlice({
    name: 'entity_application',
    initialState,
    reducers: {
    },
    extraReducers: {
        [getServicePortalTokenStatus.pending.type]: (state) => {
            state.gettingServicePortalStatus = API_REQUEST_STATE.START;
        },
        [getServicePortalTokenStatus.fulfilled.type]: (state, action: PayloadAction<boolean>) => {
            state.gettingServicePortalStatus = API_REQUEST_STATE.FINISH;
            state.servicePortalTokenStatus = action.payload;
            state.error = null;
        },
        [getServicePortalTokenStatus.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingServicePortalStatus = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default applicationSlice.reducer;
