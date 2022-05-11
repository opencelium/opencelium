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
import {INotificationTemplate} from "@interface/schedule/INotificationTemplate";
import {
    addNotificationTemplate,
    checkNotificationTemplateName,
    deleteNotificationTemplateById,
    deleteNotificationTemplatesById,
    getAllNotificationTemplates,
    getNotificationTemplateById, getNotificationTemplatesByType,
    updateNotificationTemplate,
} from "@action/schedule/NotificationTemplateCreators";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";
import {IResponse, ResponseMessages} from "@requestInterface/application/IResponse";
import {ICommonState} from "@interface/application/core";
import {CommonState} from "../../store";

export interface NotificationTemplateState extends ICommonState{
    notificationTemplates: INotificationTemplate[],
    isCurrentNotificationTemplateHasUniqueName: TRIPLET_STATE,
    checkingNotificationTemplateName: API_REQUEST_STATE,
    addingNotificationTemplate: API_REQUEST_STATE,
    updatingNotificationTemplate: API_REQUEST_STATE,
    gettingNotificationTemplate: API_REQUEST_STATE,
    gettingNotificationTemplatesByType: API_REQUEST_STATE,
    gettingNotificationTemplates: API_REQUEST_STATE,
    deletingNotificationTemplateById: API_REQUEST_STATE,
    deletingNotificationTemplatesById: API_REQUEST_STATE,
    currentNotificationTemplate: INotificationTemplate,
}

const initialState: NotificationTemplateState = {
    notificationTemplates: [],
    isCurrentNotificationTemplateHasUniqueName: TRIPLET_STATE.INITIAL,
    checkingNotificationTemplateName: API_REQUEST_STATE.INITIAL,
    addingNotificationTemplate: API_REQUEST_STATE.INITIAL,
    updatingNotificationTemplate: API_REQUEST_STATE.INITIAL,
    gettingNotificationTemplate: API_REQUEST_STATE.INITIAL,
    gettingNotificationTemplatesByType: API_REQUEST_STATE.INITIAL,
    gettingNotificationTemplates: API_REQUEST_STATE.INITIAL,
    deletingNotificationTemplateById: API_REQUEST_STATE.INITIAL,
    deletingNotificationTemplatesById: API_REQUEST_STATE.INITIAL,
    currentNotificationTemplate: null,
    ...CommonState,
}

export const notificationTemplateSlice = createSlice({
    name: 'notificationTemplate',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkNotificationTemplateName.pending.type]: (state) => {
            state.checkingNotificationTemplateName = API_REQUEST_STATE.START;
        },
        [checkNotificationTemplateName.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingNotificationTemplateName = API_REQUEST_STATE.FINISH;
            state.isCurrentNotificationTemplateHasUniqueName = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkNotificationTemplateName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingNotificationTemplateName = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addNotificationTemplate.pending.type]: (state, action: PayloadAction<INotificationTemplate>) => {
            state.addingNotificationTemplate = API_REQUEST_STATE.START;
        },
        [addNotificationTemplate.fulfilled.type]: (state, action: PayloadAction<INotificationTemplate>) => {
            state.addingNotificationTemplate = API_REQUEST_STATE.FINISH;
            state.notificationTemplates.push(action.payload);
            state.error = null;
        },
        [addNotificationTemplate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingNotificationTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateNotificationTemplate.pending.type]: (state) => {
            state.updatingNotificationTemplate = API_REQUEST_STATE.START;
        },
        [updateNotificationTemplate.fulfilled.type]: (state, action: PayloadAction<INotificationTemplate>) => {
            state.updatingNotificationTemplate = API_REQUEST_STATE.FINISH;
            state.notificationTemplates = state.notificationTemplates.map(notificationTemplate => notificationTemplate.templateId === action.payload.templateId ? action.payload : notificationTemplate);
            if(state.currentNotificationTemplate && state.currentNotificationTemplate.templateId === action.payload.templateId){
                state.currentNotificationTemplate = action.payload;
            }
            state.error = null;
        },
        [updateNotificationTemplate.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingNotificationTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getNotificationTemplateById.pending.type]: (state) => {
            state.gettingNotificationTemplate = API_REQUEST_STATE.START;
        },
        [getNotificationTemplateById.fulfilled.type]: (state, action: PayloadAction<INotificationTemplate>) => {
            state.gettingNotificationTemplate = API_REQUEST_STATE.FINISH;
            state.currentNotificationTemplate = action.payload;
            state.error = null;
        },
        [getNotificationTemplateById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingNotificationTemplate = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getNotificationTemplatesByType.pending.type]: (state) => {
            state.gettingNotificationTemplatesByType = API_REQUEST_STATE.START;
        },
        [getNotificationTemplatesByType.fulfilled.type]: (state, action: PayloadAction<INotificationTemplate[]>) => {
            state.gettingNotificationTemplatesByType = API_REQUEST_STATE.FINISH;
            state.notificationTemplates = action.payload;
            state.error = null;
        },
        [getNotificationTemplatesByType.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingNotificationTemplatesByType = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllNotificationTemplates.pending.type]: (state) => {
            state.gettingNotificationTemplates = API_REQUEST_STATE.START;
        },
        [getAllNotificationTemplates.fulfilled.type]: (state, action: PayloadAction<INotificationTemplate[]>) => {
            state.gettingNotificationTemplates = API_REQUEST_STATE.FINISH;
            state.notificationTemplates = action.payload;
            state.error = null;
        },
        [getAllNotificationTemplates.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingNotificationTemplates = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteNotificationTemplateById.pending.type]: (state) => {
            state.deletingNotificationTemplateById = API_REQUEST_STATE.START;
        },
        [deleteNotificationTemplateById.fulfilled.type]: (state, action: PayloadAction<number>) => {
            state.deletingNotificationTemplateById = API_REQUEST_STATE.FINISH;
            state.notificationTemplates = state.notificationTemplates.filter(notificationTemplate => notificationTemplate.templateId !== action.payload);
            if(state.currentNotificationTemplate && state.currentNotificationTemplate.templateId === action.payload){
                state.currentNotificationTemplate = null;
            }
            state.error = null;
        },
        [deleteNotificationTemplateById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingNotificationTemplateById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteNotificationTemplatesById.pending.type]: (state) => {
            state.deletingNotificationTemplatesById = API_REQUEST_STATE.START;
        },
        [deleteNotificationTemplatesById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.deletingNotificationTemplatesById = API_REQUEST_STATE.FINISH;
            state.notificationTemplates = state.notificationTemplates.filter(notificationTemplate => action.payload.findIndex(id => `${id}` === `${notificationTemplate.templateId}`) === -1);
            if(state.currentNotificationTemplate && action.payload.findIndex(id => `${id}` === `${state.currentNotificationTemplate.templateId}`) !== -1){
                state.currentNotificationTemplate = null;
            }
            state.error = null;
        },
        [deleteNotificationTemplatesById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingNotificationTemplatesById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default notificationTemplateSlice.reducer;