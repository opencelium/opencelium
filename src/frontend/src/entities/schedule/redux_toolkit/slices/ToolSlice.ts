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
import {IResponse} from "@application/requests/interfaces/IResponse";
import {ICommonState} from "@application/interfaces/core";
import {CommonState} from "@application/utils/store";
import {ToolModel} from "@entity/schedule/requests/models/Tool";
import {getAllTools} from "@entity/schedule/redux_toolkit/action_creators/ToolCreators";

export interface ScheduleState extends ICommonState{
    tools: ToolModel[],
    gettingAllTools: API_REQUEST_STATE,
}

const initialState: ScheduleState = {
    tools: [],
    gettingAllTools: API_REQUEST_STATE.INITIAL,
    ...CommonState,
}

export const toolSlice = createSlice({
    name: 'tool',
    initialState,
    reducers: {
    },
    extraReducers: {
        [getAllTools.pending.type]: (state) => {
            state.gettingAllTools = API_REQUEST_STATE.START;
        },
        [getAllTools.fulfilled.type]: (state, action: PayloadAction<ToolModel[]>) => {
            state.gettingAllTools = API_REQUEST_STATE.FINISH;
            state.tools = action.payload;
            state.error = null;
        },
        [getAllTools.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllTools = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const {
} = toolSlice.actions;

export const actions = {
}

export default toolSlice.reducer;
