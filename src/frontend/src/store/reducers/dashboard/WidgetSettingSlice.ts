import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {CommonState} from "../../store";
import {ICommonState} from "@interface/application/core";
import {IWidgetSetting} from "@interface/dashboard/IWidgetSetting";
import {getAllWidgetSettings, updateAllWidgetSettings} from "@action/dashboard/WidgetSettingCreators";
import {IResponse} from "@requestInterface/application/IResponse";

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