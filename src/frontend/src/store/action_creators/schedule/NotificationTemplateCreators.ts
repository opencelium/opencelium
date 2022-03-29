import {createAsyncThunk} from "@reduxjs/toolkit";
import {NotificationTemplateRequest} from "@request/schedule/NotificationTemplate";
import { INotificationTemplate } from "@interface/schedule/INotificationTemplate";
import {errorHandler} from "../../../components/utils";

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
            return response.data._embedded?.messageResourceList || [];
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
            return response.data._embedded?.messageResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteNotificationTemplateById = createAsyncThunk(
    'schedule/notification_template/delete/byId',
    async(notificationTemplate: INotificationTemplate, thunkAPI) => {
        try {
            const request = new NotificationTemplateRequest({endpoint: `/${notificationTemplate.id}`});
            await request.deleteNotificationTemplateById();
            return notificationTemplate;
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