import {createAsyncThunk} from "@reduxjs/toolkit";
import {WidgetSettingRequest} from "@request/dashboard/WidgetSetting";
import {errorHandler} from "../../../components/utils";
import {IWidgetSetting} from "@interface/dashboard/IWidgetSetting";

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