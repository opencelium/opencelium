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
import {
    getCurrentSubscription, getOperationUsageDetails, getOperationUsageEntries, setCurrentSubscription
} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";
import SubscriptionModel, {
    OperationUsageDetailModel,
    OperationUsageEntryModel
} from "@entity/license_management/requests/models/SubscriptionModel";

export interface SubscriptionState extends ICommonState{
    currentSubscription: SubscriptionModel,
    gettingCurrentSubscription: API_REQUEST_STATE,
    gettingOperationUsageEntries: API_REQUEST_STATE,
    gettingOperationUsageDetails: API_REQUEST_STATE,
    settingCurrentSubscription: API_REQUEST_STATE,
    operationUsageEntries: OperationUsageEntryModel[],
    operationUsageDetails: OperationUsageDetailModel[],
}

const initialState: SubscriptionState = {
    currentSubscription: null,
    gettingCurrentSubscription: API_REQUEST_STATE.INITIAL,
    gettingOperationUsageEntries: API_REQUEST_STATE.INITIAL,
    gettingOperationUsageDetails: API_REQUEST_STATE.INITIAL,
    settingCurrentSubscription: API_REQUEST_STATE.INITIAL,
    operationUsageEntries: [],
    operationUsageDetails: [],
    ...CommonState,
}

export const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
    },
    extraReducers: {
        [getCurrentSubscription.pending.type]: (state) => {
            state.gettingCurrentSubscription = API_REQUEST_STATE.START;
        },
        [getCurrentSubscription.fulfilled.type]: (state, action: PayloadAction<SubscriptionModel>) => {
            state.gettingCurrentSubscription = API_REQUEST_STATE.FINISH;
            state.currentSubscription = action.payload;
            state.error = null;
        },
        [getCurrentSubscription.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingCurrentSubscription = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getOperationUsageEntries.pending.type]: (state) => {
            state.gettingOperationUsageEntries = API_REQUEST_STATE.START;
        },
        [getOperationUsageEntries.fulfilled.type]: (state, action: PayloadAction<OperationUsageEntryModel[]>) => {
            state.gettingOperationUsageEntries = API_REQUEST_STATE.FINISH;
            state.operationUsageEntries = action.payload;
            state.error = null;
        },
        [getOperationUsageEntries.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingOperationUsageEntries = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getOperationUsageDetails.pending.type]: (state) => {
            state.gettingOperationUsageDetails = API_REQUEST_STATE.START;
        },
        [getOperationUsageDetails.fulfilled.type]: (state, action: PayloadAction<OperationUsageDetailModel[]>) => {
            state.gettingOperationUsageDetails = API_REQUEST_STATE.FINISH;
            state.operationUsageDetails = action.payload;
            state.error = null;
        },
        [getOperationUsageDetails.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingOperationUsageDetails = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [setCurrentSubscription.pending.type]: (state) => {
            state.settingCurrentSubscription = API_REQUEST_STATE.START;
        },
        [setCurrentSubscription.fulfilled.type]: (state, action: PayloadAction<SubscriptionModel>) => {
            state.settingCurrentSubscription = API_REQUEST_STATE.FINISH;
            state.currentSubscription = action.payload;
            state.error = null;
        },
        [setCurrentSubscription.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.settingCurrentSubscription = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default subscriptionSlice.reducer;
