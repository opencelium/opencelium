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
import {NotificationTemplateRequest} from "../../requests/classes/NotificationTemplate";
import { INotificationTemplate } from "../../interfaces/INotificationTemplate";

export const checkNotificationTemplateName = createAsyncThunk(
    'schedule/notification_template/exist/name',
    async(notificationTemplate: INotificationTemplate, thunkAPI) => {
        try {
            const request = new NotificationTemplateRequest({endpoint: `/exists/${notificationTemplate.name}`});
            const response = await request.checkNotificationTemplateName();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addNotificationTemplate = createAsyncThunk(
    'schedule/notification_template/add',
    async(notificationTemplate: INotificationTemplate, thunkAPI) => {
        try {
            /*
            * TODO: uncomment when backend has check name method
            */
            /*
            const checkNameRequest = new NotificationTemplateRequest({endpoint: `/exists/${notificationTemplate.name}`});
            const responseNameRequest = await checkNameRequest.checkNotificationTemplateName();
            if(responseNameRequest.data.message === ResponseMessages.EXISTS){
                return thunkAPI.rejectWithValue(responseNameRequest.data);
            }
             */
            const request = new NotificationTemplateRequest();
            const response = await request.addNotificationTemplate(notificationTemplate);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateNotificationTemplate = createAsyncThunk(
    'schedule/notification_template/update',
    async(notificationTemplate: INotificationTemplate, thunkAPI) => {
        try {
            /*
            * TODO: uncomment when backend has check name method
            */
            /*
            const notificationTemplateState = thunkAPI.getState().notificationTemplateReducer;
            if(notificationTemplateState.currentNotificationTemplate.name !== notificationTemplate.name){
                const checkNameRequest = new NotificationTemplateRequest({endpoint: `/exists/${notificationTemplate.name}`});
                const responseNameRequest = await checkNameRequest.checkNotificationTemplateName();
                if(responseNameRequest.data.message === ResponseMessages.EXISTS){
                    return thunkAPI.rejectWithValue(responseNameRequest.data);
                }
            }
             */
            const request = new NotificationTemplateRequest();
            const response = await request.updateNotificationTemplate(notificationTemplate);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getNotificationTemplateById = createAsyncThunk(
    'schedule/notification_template/get/byId',
    async(notificationTemplateId: number, thunkAPI) => {
        try {
            const request = new NotificationTemplateRequest({endpoint: `/${notificationTemplateId}`});
            const response = await request.getNotificationTemplateById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getNotificationTemplatesByType = createAsyncThunk(
    'schedule/notification_template/get/all/byType',
    async(type: string, thunkAPI) => {
        try {
            const request = new NotificationTemplateRequest({endpoint: `/all/${type}`});
            const response = await request.getAllNotificationTemplatesByType();
            // @ts-ignore
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllNotificationTemplates = createAsyncThunk(
    'schedule/notification_template/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new NotificationTemplateRequest({endpoint: `/all`});
            const response = await request.getAllNotificationTemplates();
            // @ts-ignore
            return response.data || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteNotificationTemplateById = createAsyncThunk(
    'schedule/notification_template/delete/byId',
    async(id: number, thunkAPI) => {
        try {
            const request = new NotificationTemplateRequest({endpoint: `/${id}`});
            await request.deleteNotificationTemplateById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteNotificationTemplatesById = createAsyncThunk(
    'schedule/notification_template/delete/selected/byId',
    async(notificationTemplateIds: number[], thunkAPI) => {
        try {
            const request = new NotificationTemplateRequest();
            await request.deleteNotificationTemplatesById(notificationTemplateIds);
            return notificationTemplateIds;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    checkNotificationTemplateName,
    addNotificationTemplate,
    updateNotificationTemplate,
    getNotificationTemplateById,
    getNotificationTemplatesByType,
    getAllNotificationTemplates,
    deleteNotificationTemplateById,
    deleteNotificationTemplatesById,
}