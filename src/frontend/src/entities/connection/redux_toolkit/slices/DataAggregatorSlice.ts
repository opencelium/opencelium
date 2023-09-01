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
import {ICommonState} from "@application/interfaces/core";
import {CommonState} from "@application/utils/store";
import {addAggregator, updateAggregator} from "@root/redux_toolkit/action_creators/DataAggregatorCreators";
import {IResponse} from "@application/requests/interfaces/IResponse";
import ModelDataAggregator from "@root/requests/models/DataAggregator";

export interface DataAggregatorState extends ICommonState{
    addingDataAggregator: API_REQUEST_STATE,
    updatingDataAggregator: API_REQUEST_STATE,
    currentAggregator: ModelDataAggregator,
}
const initialState: DataAggregatorState = {
    addingDataAggregator: API_REQUEST_STATE.INITIAL,
    updatingDataAggregator: API_REQUEST_STATE.INITIAL,
    currentAggregator: null,
    ...CommonState,
}

export const dataAggregatorSlice = createSlice({
    name: 'data_aggregator',
    initialState,
    reducers: {
        setCurrentAggregator: (state, action: PayloadAction<ModelDataAggregator>) => {
            state.currentAggregator = action.payload;
        }
    },
    extraReducers: {
        [addAggregator.pending.type]: (state) => {
            state.addingDataAggregator = API_REQUEST_STATE.START;
        },
        [addAggregator.fulfilled.type]: (state, action: PayloadAction<ModelDataAggregator>) => {
            state.addingDataAggregator = API_REQUEST_STATE.FINISH;
            state.currentAggregator = action.payload;
            state.error = null;
        },
        [addAggregator.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingDataAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateAggregator.pending.type]: (state) => {
            state.updatingDataAggregator = API_REQUEST_STATE.START;
        },
        [updateAggregator.fulfilled.type]: (state, action: PayloadAction<ModelDataAggregator>) => {
            state.updatingDataAggregator = API_REQUEST_STATE.FINISH;
            state.currentAggregator = action.payload;
            state.error = null;
        },
        [updateAggregator.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingDataAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    setCurrentAggregator,
} = dataAggregatorSlice.actions;

export default dataAggregatorSlice.reducer;
