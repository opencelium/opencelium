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

import { Middleware } from 'redux'

import {AppDispatch, RootState} from "@store/store";
import {LocalStorage} from "@class/../classes/application/LocalStorage";
import {addNotification, clearAllNotifications, clearNotification } from '@slice/application/ApplicationSlice';
import {logout} from "@slice/application/AuthSlice";
import {PayloadAction} from "@reduxjs/toolkit";
import {INotification, NotificationType} from "@interface/application/INotification";
import {NotificationTranslations} from "@translations/en/notifications";
import {login} from "@action/application/AuthCreators";
import {CNotification} from "@class/application/Notification";
import {LogoutProps} from "@interface/application/IAuth";

const FulfilledActions = Object.keys(NotificationTranslations.fulfilled);
const RejectedActions = Object.keys(NotificationTranslations.rejected);

interface NotificationDataProps{
    hasNotification: boolean,
    type: NotificationType,
}

export const notificationMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    const dispatch: AppDispatch = storeApi.dispatch;
    const notificationData: NotificationDataProps = getNotificationData(action);
    if(notificationData.hasNotification){
        let date = new Date();
        const notification: INotification = {
            id: date.getTime(),
            type: notificationData.type,
            title: 'OC',
            actionType: action.type,
            createdTime: date.getTime().toString(),
            params: {...action.payload},
        };
        dispatch(addNotification(notification));
    }
    if (addNotification.match(action)) {
        const state = storeApi.getState().applicationReducer;
        const storage = LocalStorage.getStorage();
        storage.set('notifications', [action.payload, ...state.notifications]);
    }
    if (clearNotification.match(action)) {
        const state = storeApi.getState().applicationReducer;
        const storage = LocalStorage.getStorage();
        storage.set('notifications', [...state.notifications].filter(notification => notification.id !== action.payload.id));
    }
    if (clearAllNotifications.match(action)) {
        const storage = LocalStorage.getStorage();
        storage.set('notifications', []);
    }
    if(login.pending.type === action.type){
        const storage = LocalStorage.getStorage();
        storage.remove('notifications');
        dispatch(clearAllNotifications());
    }
    if (logout.match(action)) {
        const logoutProps: LogoutProps = action.payload;
        if(logoutProps?.wasAccessDenied){
            setTimeout(() => dispatch(addNotification(CNotification.getAccessDeniedMessage(logoutProps.message))), 500);
        }
    }
    return next(action);
}

const getNotificationData = (action: PayloadAction<any>): NotificationDataProps => {
    let withoutNotification = action.payload?.settings?.withoutNotification;
    let hasNotification;
    let type;
    if(withoutNotification === true){
        hasNotification = false;
    } else {
        const isFulfilledAction = FulfilledActions.indexOf(action.type) !== -1;
        const isRejectedAction = RejectedActions.indexOf(action.type) !== -1;
        if (isFulfilledAction) type = NotificationType.SUCCESS;
        if (isRejectedAction) type = NotificationType.ERROR;
        hasNotification = isFulfilledAction || isRejectedAction
    }
    return {hasNotification, type}
}