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
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {CommonState} from "@application/utils/store";
import {ICommonState} from "@application/interfaces/core";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {getAllWidgets} from "../action_creators/WidgetCreators";
import {IWidget} from "../../interfaces/IWidget";

export interface WidgetSlice extends ICommonState{
    gettingAllWidgets: API_REQUEST_STATE,
    widgets: IWidget[],
}

const initialState: WidgetSlice = {
    gettingAllWidgets: API_REQUEST_STATE.INITIAL,
    widgets: [],
    ...CommonState,
}

export const widgetSlice = createSlice({
    name: 'widget',
    initialState,
    reducers: {
    },
    extraReducers: {
        [getAllWidgets.pending.type]: (state) => {
            state.gettingAllWidgets = API_REQUEST_STATE.START;
        },
        [getAllWidgets.fulfilled.type]: (state, action: PayloadAction<IWidget[]>) => {
            const WIDGET_COORDINATES = {
                'CONNECTION_OVERVIEW': {x: 0, y: 0, w: 6, h: 4, minW: 6, minH: 4},
                'CURRENT_SCHEDULER': {x: 10, y: 0, w: 6, h: 3, minW: 6, minH: 3},
                'MONITORING_BOARDS': {x: 0, y: 0, w: 6, h: 4, minW: 6, minH: 4}
            };
            state.gettingAllWidgets = API_REQUEST_STATE.FINISH;
            state.widgets = action.payload.map(widget => {return {...widget, ...WIDGET_COORDINATES[widget.i]};});
            state.error = null;
        },
        [getAllWidgets.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllWidgets = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default widgetSlice.reducer;