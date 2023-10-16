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

import {createSlice, PayloadAction, current} from "@reduxjs/toolkit";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {ICommonState} from "@application/interfaces/core";
import {CommonState} from "@application/utils/store";
import {
    addAggregator, getAllAggregators, getAggregatorById,
    updateAggregator, archiveAggregatorById, unarchiveAggregatorById, deleteArgument, getAllUnarchivedAggregators
} from "@entity/data_aggregator/redux_toolkit/action_creators/DataAggregatorCreators";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import ModelDataAggregator from "@entity/data_aggregator/requests/models/DataAggregator";
import { FormType } from "@entity/data_aggregator/components/dialog_button/interfaces";

export interface DataAggregatorState extends ICommonState{
    isCurrentAggregatorHasUniqueName: TRIPLET_STATE,
    addingAggregator: API_REQUEST_STATE,
    updatingAggregator: API_REQUEST_STATE,
    gettingAggregator: API_REQUEST_STATE,
    gettingAllAggregators: API_REQUEST_STATE,
    gettingAllUnarchivedAggregators: API_REQUEST_STATE,
    archivingAggregator: API_REQUEST_STATE,
    unarchivingAggregator: API_REQUEST_STATE,
    deletingAggregatorById: API_REQUEST_STATE,
    currentAggregator: ModelDataAggregator,
    aggregators: ModelDataAggregator[],
    unarchivedAggregators: ModelDataAggregator[],
    isForm: boolean,
    isDataAggregatorModalToggled: boolean,
    formType: FormType,
}
const initialState: DataAggregatorState = {
    isCurrentAggregatorHasUniqueName: TRIPLET_STATE.INITIAL,
    addingAggregator: API_REQUEST_STATE.INITIAL,
    updatingAggregator: API_REQUEST_STATE.INITIAL,
    gettingAggregator: API_REQUEST_STATE.INITIAL,
    gettingAllAggregators: API_REQUEST_STATE.INITIAL,
    gettingAllUnarchivedAggregators: API_REQUEST_STATE.INITIAL,
    archivingAggregator: API_REQUEST_STATE.INITIAL,
    unarchivingAggregator: API_REQUEST_STATE.INITIAL,
    deletingAggregatorById: API_REQUEST_STATE.INITIAL,
    currentAggregator: null,
    aggregators: [],
    unarchivedAggregators: [],
    isForm: false,
    formType: 'add',
    isDataAggregatorModalToggled: false,
    ...CommonState,
}

export const dataAggregatorSlice = createSlice({
    name: 'data_aggregator',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentAggregator: (state, action: PayloadAction<ModelDataAggregator>) => {
            state.currentAggregator = action.payload;
        },
        setIsForm: (state, action: PayloadAction<boolean>) => {
            state.isForm = action.payload;
        },
        setFormType: (state, action: PayloadAction<FormType>) => {
            state.formType = action.payload;
        },
        toggleDataAggregatorModal: (state, action: PayloadAction<boolean>) => {
            state.isDataAggregatorModalToggled = action.payload;
        },
    },
    extraReducers: {
        [addAggregator.pending.type]: (state) => {
            state.isCurrentAggregatorHasUniqueName = TRIPLET_STATE.INITIAL;
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
            if(action.payload.result === false){
                state.isCurrentAggregatorHasUniqueName = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [updateAggregator.pending.type]: (state) => {
            state.isCurrentAggregatorHasUniqueName = TRIPLET_STATE.INITIAL;
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
            if(!action.payload.result){
                state.isCurrentAggregatorHasUniqueName = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [getAggregatorById.pending.type]: (state) => {
            state.gettingAggregator = API_REQUEST_STATE.START;
            state.isCurrentAggregatorHasUniqueName = TRIPLET_STATE.INITIAL;
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
            state.isCurrentAggregatorHasUniqueName = TRIPLET_STATE.INITIAL;
            state.aggregators = action.payload;
            state.currentAggregator = null;
            state.error = null;
        },
        [getAllAggregators.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllAggregators = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllUnarchivedAggregators.pending.type]: (state) => {
            state.gettingAllUnarchivedAggregators = API_REQUEST_STATE.START;
        },
        [getAllUnarchivedAggregators.fulfilled.type]: (state, action: PayloadAction<ModelDataAggregator[]>) => {
            state.gettingAllUnarchivedAggregators = API_REQUEST_STATE.FINISH;
            state.isCurrentAggregatorHasUniqueName = TRIPLET_STATE.INITIAL;
            state.unarchivedAggregators = action.payload;
            state.currentAggregator = null;
            state.error = null;
        },
        [getAllUnarchivedAggregators.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllUnarchivedAggregators = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [archiveAggregatorById.pending.type]: (state) => {
            state.archivingAggregator = API_REQUEST_STATE.START;
        },
        [archiveAggregatorById.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.archivingAggregator = API_REQUEST_STATE.FINISH;
            state.aggregators = current(state.aggregators).map(aggregator => aggregator.id === action.payload ? {...aggregator, active: false} : aggregator);
            state.error = null;
        },
        [archiveAggregatorById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.archivingAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [unarchiveAggregatorById.pending.type]: (state) => {
            state.unarchivingAggregator = API_REQUEST_STATE.START;
        },
        [unarchiveAggregatorById.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.unarchivingAggregator = API_REQUEST_STATE.FINISH;
            state.aggregators = current(state.aggregators).map(aggregator => aggregator.id === action.payload ? {...aggregator, active: true} : aggregator);
            state.error = null;
        },
        [unarchiveAggregatorById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.unarchivingAggregator = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteArgument.pending.type]: (state) => {
            state.deletingAggregatorById = API_REQUEST_STATE.START;
        },
        [deleteArgument.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.deletingAggregatorById = API_REQUEST_STATE.FINISH;
            if(state.currentAggregator){
                state.currentAggregator = {...state.currentAggregator, args: state.currentAggregator.args.filter(a => a.id !== action.payload)};
            }
            state.error = null;
        },
        [deleteArgument.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingAggregatorById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    setCurrentAggregator, clearError, setIsForm, setFormType,
    toggleDataAggregatorModal,
} = dataAggregatorSlice.actions;

export default dataAggregatorSlice.reducer;
