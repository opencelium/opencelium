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

import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import {WidgetSettingRequest} from "../../requests/classes/WidgetSetting";
import {IWidgetSetting} from "../../interfaces/IWidgetSetting";

export const getAllWidgetSettings = createAsyncThunk(
    'widget_setting/get/all',
    async(data: never, thunkAPI) => {
        try {
            // @ts-ignore
            let userId = thunkAPI.getState().authReducer.authUser.id;
            const request = new WidgetSettingRequest({endpoint: `/user/${userId}`});
            const response = await request.getAllWidgetSettingsByUserId();
            return response.data.widgetSettings;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateAllWidgetSettings = createAsyncThunk(
    'widget_setting/update/all',
    async(widgetSettings: IWidgetSetting[], thunkAPI) => {
        try {
            // @ts-ignore
            let userId = thunkAPI.getState().authReducer.authUser.id;
            const request = new WidgetSettingRequest();
            await request.updateAllWidgetSettings({userId, widgetSettings});
            return widgetSettings;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getAllWidgetSettings,
    updateAllWidgetSettings,
}