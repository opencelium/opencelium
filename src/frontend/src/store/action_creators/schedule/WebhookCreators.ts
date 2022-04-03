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