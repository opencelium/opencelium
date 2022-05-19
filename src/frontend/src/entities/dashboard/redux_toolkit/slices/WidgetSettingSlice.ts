/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {IWidgetSetting} from "../../interfaces/IWidgetSetting";
import {getAllWidgetSettings, updateAllWidgetSettings} from "../action_creators/WidgetSettingCreators";

export interface WidgetSettingSlice extends ICommonState{
    gettingAllWidgetSettings: API_REQUEST_STATE,
    updatingAllWidgetSettings: API_REQUEST_STATE,
    widgetSettings: IWidgetSetting[],
}

const initialState: WidgetSettingSlice = {
    gettingAllWidgetSettings: API_REQUEST_STATE.INITIAL,
    updatingAllWidgetSettings: API_REQUEST_STATE.INITIAL,
    widgetSettings: [],
    ...CommonState,
}

export const widgetSettingSlice = createSlice({
    name: 'widgetSetting',
    initialState,
    reducers: {
    },
    extraReducers: {
        [getAllWidgetSettings.pending.type]: (state) => {
            state.gettingAllWidgetSettings = API_REQUEST_STATE.START;
        },
        [getAllWidgetSettings.fulfilled.type]: (state, action: PayloadAction<IWidgetSetting[]>) => {
            state.gettingAllWidgetSettings = API_REQUEST_STATE.FINISH;
            state.widgetSettings = action.payload;
            state.error = null;
        },
        [getAllWidgetSettings.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingAllWidgetSettings = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateAllWidgetSettings.pending.type]: (state) => {
            state.updatingAllWidgetSettings = API_REQUEST_STATE.START;
        },
        [updateAllWidgetSettings.fulfilled.type]: (state, action: PayloadAction<IWidgetSetting[]>) => {
            state.updatingAllWidgetSettings = API_REQUEST_STATE.FINISH;
            state.widgetSettings = action.payload;
            state.error = null;
        },
        [updateAllWidgetSettings.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingAllWidgetSettings = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default widgetSettingSlice.reducer;