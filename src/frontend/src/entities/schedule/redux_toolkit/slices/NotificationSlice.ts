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
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IResponse, ResponseMessages} from "@application/requests/interfaces/IResponse";
import {ICommonState} from "@application/interfaces/core";
import {CommonState} from "@application/utils/store";
import IUser from "@entity/user/interfaces/IUser";
import {INotification} from "../../interfaces/INotification";
import {
    addNotification,
    checkNotificationName,
    deleteNotificationById,
    getNotificationById, getNotificationByScheduleIdAndId, getNotificationRecipients, getNotificationsByScheduleId,
    updateNotification,
} from "../action_creators/NotificationCreators";

export interface NotificationState extends ICommonState{
    recipients: IUser[],
    notifications: INotification[],
    isCurrentNotificationHasUniqueName: TRIPLET_STATE,
    checkingNotificationName: API_REQUEST_STATE,
    addingNotification: API_REQUEST_STATE,
    updatingNotification: API_REQUEST_STATE,
    gettingNotificationById: API_REQUEST_STATE,
    gettingNotificationByScheduleIdAndId: API_REQUEST_STATE,
    gettingNotificationsByScheduleId: API_REQUEST_STATE,
    gettingNotificationRecipients: API_REQUEST_STATE,
    deletingNotificationById: API_REQUEST_STATE,
    currentNotification: INotification,
    currentScheduleId: number,
}

const initialState: NotificationState = {
    recipients: [],
    notifications: [],
    isCurrentNotificationHasUniqueName: TRIPLET_STATE.INITIAL,
    checkingNotificationName: API_REQUEST_STATE.INITIAL,
    addingNotification: API_REQUEST_STATE.INITIAL,
    updatingNotification: API_REQUEST_STATE.INITIAL,
    gettingNotificationById: API_REQUEST_STATE.INITIAL,
    gettingNotificationByScheduleIdAndId: API_REQUEST_STATE.INITIAL,
    gettingNotificationsByScheduleId: API_REQUEST_STATE.INITIAL,
    gettingNotificationRecipients: API_REQUEST_STATE.INITIAL,
    deletingNotificationById: API_REQUEST_STATE.INITIAL,
    currentNotification: null,
    currentScheduleId: 0,
    ...CommonState,
}

export const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
    },
    extraReducers: {
        [checkNotificationName.pending.type]: (state) => {
            state.checkingNotificationName = API_REQUEST_STATE.START;
        },
        [checkNotificationName.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingNotificationName = API_REQUEST_STATE.FINISH;
            state.isCurrentNotificationHasUniqueName = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkNotificationName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingNotificationName = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addNotification.pending.type]: (state, action: PayloadAction<INotification>) => {
            state.addingNotification = API_REQUEST_STATE.START;
        },
        [addNotification.fulfilled.type]: (state, action: PayloadAction<INotification>) => {
            state.addingNotification = API_REQUEST_STATE.FINISH;
            state.notifications.push(action.payload);
            state.error = null;
        },
        [addNotification.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingNotification = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateNotification.pending.type]: (state) => {
            state.updatingNotification = API_REQUEST_STATE.START;
        },
        [updateNotification.fulfilled.type]: (state, action: PayloadAction<INotification>) => {
            state.updatingNotification = API_REQUEST_STATE.FINISH;
            state.notifications = state.notifications.map(notification => notification.notificationId === action.payload.notificationId ? action.payload : notification);
            if(state.currentNotification && state.currentNotification.notificationId === action.payload.notificationId){
                state.currentNotification = action.payload;
            }
            state.error = null;
        },
        [updateNotification.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingNotification = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getNotificationById.pending.type]: (state) => {
            state.gettingNotificationById = API_REQUEST_STATE.START;
        },
        [getNotificationById.fulfilled.type]: (state, action: PayloadAction<INotification>) => {
            state.gettingNotificationById = API_REQUEST_STATE.FINISH;
            state.currentNotification = action.payload;
            state.error = null;
        },
        [getNotificationById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingNotificationById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getNotificationByScheduleIdAndId.pending.type]: (state) => {
            state.gettingNotificationByScheduleIdAndId = API_REQUEST_STATE.START;
        },
        [getNotificationByScheduleIdAndId.fulfilled.type]: (state, action: PayloadAction<INotification>) => {
            state.gettingNotificationByScheduleIdAndId = API_REQUEST_STATE.FINISH;
            state.currentNotification = action.payload;
            state.error = null;
        },
        [getNotificationByScheduleIdAndId.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingNotificationByScheduleIdAndId = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getNotificationsByScheduleId.pending.type]: (state, action: any) => {
            state.gettingNotificationsByScheduleId = API_REQUEST_STATE.START;
            state.currentScheduleId = action.meta.arg;
        },
        [getNotificationsByScheduleId.fulfilled.type]: (state, action: PayloadAction<INotification[]>) => {
            state.gettingNotificationsByScheduleId = API_REQUEST_STATE.FINISH;
            state.notifications = action.payload;
            state.currentScheduleId = 0;
            state.error = null;
        },
        [getNotificationsByScheduleId.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingNotificationsByScheduleId = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getNotificationRecipients.pending.type]: (state) => {
            state.gettingNotificationRecipients = API_REQUEST_STATE.START;
        },
        [getNotificationRecipients.fulfilled.type]: (state, action: PayloadAction<IUser[]>) => {
            state.gettingNotificationRecipients = API_REQUEST_STATE.FINISH;
            state.recipients = action.payload;
            state.error = null;
        },
        [getNotificationRecipients.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingNotificationRecipients = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteNotificationById.pending.type]: (state) => {
            state.deletingNotificationById = API_REQUEST_STATE.START;
        },
        [deleteNotificationById.fulfilled.type]: (state, action: PayloadAction<INotification>) => {
            state.deletingNotificationById = API_REQUEST_STATE.FINISH;
            state.notifications = state.notifications.filter(notification => notification.notificationId !== action.payload.id);
            if(state.currentNotification && state.currentNotification.notificationId === action.payload.id){
                state.currentNotification = null;
            }
            state.error = null;
        },
        [deleteNotificationById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingNotificationById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default notificationSlice.reducer;