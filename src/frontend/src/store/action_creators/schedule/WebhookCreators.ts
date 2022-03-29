import {createAsyncThunk} from "@reduxjs/toolkit";
import {WebhookRequest} from "@request/schedule/Webhook";
import {ISchedule} from "@interface/schedule/ISchedule";
import {errorHandler} from "../../../components/utils";


export const getWebhook = createAsyncThunk(
    'schedule/webhook/get/byUserIdAndScheduleId',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            // @ts-ignore
            const userId = thunkAPI.getState().authReducer.authUser.id;
            const request = new WebhookRequest({endpoint: `/url/${userId}/${schedule.id}`});
            const response = await request.getWebhookByUserIdAndScheduleId();
            schedule.webhook = response.data;
            return schedule;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteWebhook = createAsyncThunk(
    'schedule/webhook/delete/byScheduleId',
    async(schedule: ISchedule, thunkAPI) => {
        try {
            const request = new WebhookRequest({endpoint: `/${schedule.webhook.webhookId}`});
            await request.deleteWebhookById();
            return schedule;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getWebhook,
    deleteWebhook,
}