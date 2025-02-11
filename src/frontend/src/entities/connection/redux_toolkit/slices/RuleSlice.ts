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
import { API_REQUEST_STATE } from "@application/interfaces/IApplication";
import { ICommonState } from "@application/interfaces/core";
import { CommonState } from "@application/utils/store";
import { IResponse } from "@application/requests/interfaces/IResponse";
import {
    createRule, deleteAllRulesByConnection, deleteRule,
    getAllRulesByConnection,
    getRule,
    updateRule
} from "@root/redux_toolkit/action_creators/RuleCreators";
import {RuleRecordModel} from "@root/requests/models/Rule";

export interface RuleState extends ICommonState{
    creatingRule: API_REQUEST_STATE,
    updatingRule: API_REQUEST_STATE,
    gettingRule: API_REQUEST_STATE,
    gettingRulesByConnection: API_REQUEST_STATE,
    deletingRule: API_REQUEST_STATE,
    deletingRulesByConnection: API_REQUEST_STATE,
    currentRule: RuleRecordModel,
    connectionRules: RuleRecordModel[],
}
const initialState: RuleState = {
    creatingRule: API_REQUEST_STATE.INITIAL,
    updatingRule: API_REQUEST_STATE.INITIAL,
    gettingRule: API_REQUEST_STATE.INITIAL,
    gettingRulesByConnection: API_REQUEST_STATE.INITIAL,
    deletingRule: API_REQUEST_STATE.INITIAL,
    deletingRulesByConnection: API_REQUEST_STATE.INITIAL,
    currentRule: undefined,
    connectionRules: [],
    ...CommonState,
}

export const connectionEditorSlice = createSlice({
    name: 'connection_rule',
    initialState,
    reducers: {
        clearRules: (state) => {
            state.connectionRules = [];
        }
    },
    extraReducers: {
        [createRule.pending.type]: (state) => {
            state.creatingRule = API_REQUEST_STATE.START;
        },
        [createRule.fulfilled.type]: (state, action: PayloadAction<RuleRecordModel>) => {
            state.creatingRule = API_REQUEST_STATE.FINISH;
            state.connectionRules.push(action.payload);
            state.error = null;
        },
        [createRule.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.creatingRule = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateRule.pending.type]: (state) => {
            state.updatingRule = API_REQUEST_STATE.START;
        },
        [updateRule.fulfilled.type]: (state, action: PayloadAction<RuleRecordModel>) => {
            state.updatingRule = API_REQUEST_STATE.FINISH;
            state.connectionRules = state.connectionRules.map(rule => rule.ruleId === action.payload.ruleId ? action.payload : rule);
            if(state.currentRule && state.currentRule.ruleId === action.payload.ruleId){
                state.currentRule = action.payload;
            }
            state.error = null;
        },
        [updateRule.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingRule = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getRule.pending.type]: (state) => {
            state.gettingRule = API_REQUEST_STATE.START;
        },
        [getRule.fulfilled.type]: (state, action: PayloadAction<RuleRecordModel>) => {
            state.gettingRule = API_REQUEST_STATE.FINISH;
            state.currentRule = action.payload;
            state.error = null;
        },
        [getRule.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingRule = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllRulesByConnection.pending.type]: (state) => {
            state.gettingRulesByConnection = API_REQUEST_STATE.START;
        },
        [getAllRulesByConnection.fulfilled.type]: (state, action: PayloadAction<RuleRecordModel[]>) => {
            state.gettingRulesByConnection = API_REQUEST_STATE.FINISH;
            state.connectionRules = action.payload;
            state.error = null;
        },
        [getAllRulesByConnection.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingRulesByConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteRule.pending.type]: (state) => {
            state.deletingRule = API_REQUEST_STATE.START;
        },
        [deleteRule.fulfilled.type]: (state, action: PayloadAction<string>) => {
            state.deletingRule = API_REQUEST_STATE.FINISH;
            state.connectionRules = state.connectionRules.filter(rule => rule.ruleId !== action.payload);
            if(state.currentRule && state.currentRule.ruleId === action.payload){
                state.currentRule = null;
            }
            state.error = null;
        },
        [deleteRule.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingRule = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteAllRulesByConnection.pending.type]: (state) => {
            state.deletingRulesByConnection = API_REQUEST_STATE.START;
        },
        [deleteAllRulesByConnection.fulfilled.type]: (state) => {
            state.deletingRulesByConnection = API_REQUEST_STATE.FINISH;
            state.connectionRules = [];
            state.error = null;
        },
        [deleteAllRulesByConnection.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingRulesByConnection = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
    clearRules,
} = connectionEditorSlice.actions;

export default connectionEditorSlice.reducer;
