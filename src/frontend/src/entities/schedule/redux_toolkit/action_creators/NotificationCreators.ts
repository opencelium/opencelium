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

import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import {NotificationRequest} from "../../requests/classes/Notification";
import { INotification } from "../../interfaces/INotification";

export const checkNotificationName = createAsyncThunk(
    'schedule/notification/exist/title',
    async(notificationTemplate: INotification, thunkAPI) => {
        try {
            const request = new NotificationRequest({endpoint: `/exists/${notificationTemplate.name}`});
            const response = await request.checkNotificationName();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addNotification = createAsyncThunk(
    'schedule/notification/add',
    async(notificationTemplate: INotification, thunkAPI) => {
        try {
            const request = new NotificationRequest({endpoint: `/${notificationTemplate.scheduleId}/notification`});
            const response = await request.addNotification(notificationTemplate);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateNotification = createAsyncThunk(
    'schedule/notification/update',
    async(notificationTemplate: INotification, thunkAPI) => {
        try {
            const request = new NotificationRequest({endpoint: `/${notificationTemplate.scheduleId}/notification/${notificationTemplate.id}`});
            const response = await request.updateNotification(notificationTemplate);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getNotificationById = createAsyncThunk(
    'schedule/notification/get/byId',
    async(notificationTemplateId: number, thunkAPI) => {
        try {
            const request = new NotificationRequest({endpoint: `/${notificationTemplateId}`});
            const response = await request.getNotificationById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getNotificationByScheduleIdAndId = createAsyncThunk(
    'schedule/notification/get/byScheduleIdAndId',
    async(data: {scheduleId: number, id: number}, thunkAPI) => {
        try {
            const request = new NotificationRequest({endpoint: `/${data.scheduleId}/notification/${data.id}`});
            const response = await request.getNotificationByScheduleIdAndId();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getNotificationsByScheduleId = createAsyncThunk(
    'schedule/notification/get/all/bySchedule',
    async(scheduleId: number, thunkAPI) => {
        try {
            const request = new NotificationRequest({endpoint: `/${scheduleId}/notification/all`});
            const response = await request.getAllNotificationsByScheduleId();
            // @ts-ignore
            return response.data._embedded?.notificationResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getNotificationRecipients = createAsyncThunk(
    'schedule/notification/get/all/recipients',
    async(data: never, thunkAPI) => {
        try {
            const request = new NotificationRequest();
            const response = await request.getNotificationRecipients();
            // @ts-ignore
            return response.data._embedded?.userResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteNotificationById = createAsyncThunk(
    'schedule/notification/delete/byId',
    async(notificationTemplate: INotification, thunkAPI) => {
        try {
            const request = new NotificationRequest({endpoint: `/${notificationTemplate.scheduleId}/notification/${notificationTemplate.id}`});
            await request.deleteNotificationById();
            return notificationTemplate;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkNotificationName,
    addNotification,
    updateNotification,
    getNotificationById,
    getNotificationByScheduleIdAndId,
    getNotificationsByScheduleId,
    getNotificationRecipients,
    deleteNotificationById,
}