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
import {
    addAggregator, deleteAggregatorById, getAllAggregators, getAggregatorById,
    updateAggregator
} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import {IResponse} from "@application/requests/interfaces/IResponse";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";

export interface DataAggregatorState extends ICommonState{
    addingAggregator: API_REQUEST_STATE,
    updatingAggregator: API_REQUEST_STATE,
    gettingAggregator: API_REQUEST_STATE,
    gettingAllAggregators: API_REQUEST_STATE,
    deletingAggregator: API_REQUEST_STATE,
    currentAggregator: ModelDataAggregator,
    aggregators: ModelDataAggregator[],
}
const initialState: DataAggregatorState = {
    addingAggregator: API_REQUEST_STATE.INITIAL,
    updatingAggregator: API_REQUEST_STATE.INITIAL,
    gettingAggregator: API_REQUEST_STATE.INITIAL,
    gettingAllAggregators: API_REQUEST_STATE.INITIAL,
    deletingAggregator: API_REQUEST_STATE.INITIAL,
    currentAggregator: null,
    aggregators: [],
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
            state.addingAggregator = API_REQUEST_STATE.START;
        },
        [addAggregator.fulfilled.type]: (state, action: PayloadAction<ModelDataAggregator>) => {
            state.addingAggregator = API_REQUEST_STATE.FINISH;
            state.currentAggregator = action.payload;
            state.aggregators.push(action.payload);
            state.error = null;
        },
        [addAggregator.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateAggregator.pending.type]: (state) => {
            state.updatingAggregator = API_REQUEST_STATE.START;
        },
        [updateAggregator.fulfilled.type]: (state, action: PayloadAction<ModelDataAggregator>) => {
            state.updatingAggregator = API_REQUEST_STATE.FINISH;
            state.aggregators = state.aggregators.map(aggregator => aggregator.id === action.payload.id ? action.payload : aggregator);
            state.currentAggregator = action.payload;
            state.error = null;
        },
        [updateAggregator.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAggregatorById.pending.type]: (state) => {
            state.gettingAggregator = API_REQUEST_STATE.START;
            state.currentAggregator = null;
        },
        [getAggregatorById.fulfilled.type]: (state, action: PayloadAction<ModelDataAggregator>) => {
            state.gettingAggregator = API_REQUEST_STATE.FINISH;
            state.currentAggregator = action.payload;
            state.error = null;
        },
        [getAggregatorById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllAggregators.pending.type]: (state) => {
            state.gettingAllAggregators = API_REQUEST_STATE.START;
        },
        [getAllAggregators.fulfilled.type]: (state, action: PayloadAction<ModelDataAggregator[]>) => {
            state.gettingAllAggregators = API_REQUEST_STATE.FINISH;
            state.aggregators = action.payload;
            state.currentAggregator = null;
            state.error = null;
        },
        [getAllAggregators.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllAggregators = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteAggregatorById.pending.type]: (state) => {
            state.deletingAggregator = API_REQUEST_STATE.START;
        },
        [deleteAggregatorById.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.deletingAggregator = API_REQUEST_STATE.FINISH;
            state.aggregators = state.aggregators.filter(aggregator => aggregator.id !== action.payload);
            if(state.currentAggregator && state.currentAggregator.id === action.payload){
                state.currentAggregator = null;
            }
            state.error = null;
        },
        [deleteAggregatorById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    setCurrentAggregator,
} = dataAggregatorSlice.actions;

export default dataAggregatorSlice.reducer;
