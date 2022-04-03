 

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

import React from 'react';
import i18n from "@utils/i18n";

import {
    UsersAction, UserGroupsAction, AuthAction, AppAction, ConnectorsAction,
    ConnectionsAction, SchedulesAction, TemplatesAction, WebHooksAction,
    AppsAction, AdminCardsAction, InvokersAction, NotificationTemplatesAction,
    UpdateAssistantAction, SubscriptionUpdate,
} from '@utils/actions';
import AvailableUpdateMessage from "@basic_components/translations/AvailableUpdateMessage";
import AvailableSubscriptionUpdateMessage from "@basic_components/translations/AvailableSubscriptionUpdateMessage";


/**
 * notification constants to define what requests should be notified after execution
 */
export const EntitiesWithNotification = [
    {name: UsersAction.ADD_USER, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UsersAction.ADD_PROFILEPICTURE, types: ['FULFILLED']},
    {name: UsersAction.FETCH_USERS, types: ['REJECTED']},
    {name: UsersAction.UPDATE_USER, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UsersAction.UPDATE_PROFILEPICTURE, types: ['FULFILLED']},
    {name: UsersAction.UPDATE_USERDETAIL, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UsersAction.DELETE_USER, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UsersAction.DELETE_USERS, types: ['FULFILLED', 'REJECTED']},
    {name: UserGroupsAction.ADD_USERGROUP, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UserGroupsAction.ADD_GROUPICON, types: ['FULFILLED']},
    {name: UserGroupsAction.FETCH_USERGROUPS, types: ['REJECTED']},
    {name: UserGroupsAction.UPDATE_USERGROUP, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UserGroupsAction.UPDATE_GROUPICON, types: ['FULFILLED']},
    {name: UserGroupsAction.DELETE_USERGROUP, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UserGroupsAction.DELETE_USERGROUPS, types: ['FULFILLED', 'REJECTED']},
    {name: AuthAction.LOG_IN, types: ['REJECTED']},
    {name: AuthAction.SESSION_EXPIRED, types: ['WARNED']},
    {name: AuthAction.UPDATE_AUTH_USER_LANGUAGE, types: ['FULFILLED', 'REJECTED']},
    {name: AuthAction.TOGGLE_APPTOUR, types: ['FULFILLED', 'REJECTED']},
    {name: AuthAction.UPDATE_THEME, types: ['FULFILLED', 'REJECTED']},
    {name: AppAction.DO_REQUEST, types: ['REJECTED']},
    {name: ConnectorsAction.TEST_CONNECTOR, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectorsAction.ADD_CONNECTOR, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectorsAction.ADD_CONNECTORICON, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectorsAction.FETCH_CONNECTORS, types: ['REJECTED']},
    {name: ConnectorsAction.UPDATE_CONNECTOR, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectorsAction.UPDATE_CONNECTORICON, types: ['REJECTED']},
    {name: ConnectorsAction.DELETE_CONNECTOR, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectorsAction.DELETE_CONNECTORS, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectionsAction.ADD_CONNECTION, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectionsAction.FETCH_CONNECTIONS, types: ['REJECTED']},
    {name: ConnectionsAction.UPDATE_CONNECTION, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectionsAction.DELETE_CONNECTION, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectionsAction.DELETE_CONNECTIONS, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectionsAction.CHECK_CONNECTION, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectionsAction.CHECK_NEO4J, types: ['REJECTED']},
    {name: SchedulesAction.TRIGGER_SCHEDULE, types: ['FULFILLED', 'REJECTED']},
    {name: SchedulesAction.TRIGGER_SCHEDULESUCCESS, types: ['FULFILLED']},
    {name: SchedulesAction.ADD_SCHEDULE, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.ADD_SCHEDULENOTIFICATION, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.UPDATE_SCHEDULENOTIFICATION, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.DELETE_SCHEDULENOTIFICATION, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.FETCH_SCHEDULES, types: ['REJECTED']},
    {name: SchedulesAction.DELETE_SCHEDULE, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.UPDATE_SCHEDULE, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.UPDATE_SCHEDULESTATUS, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.DELETE_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.ENABLE_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.DISABLE_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.START_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: TemplatesAction.FETCH_TEMPLATES, types: ['REJECTED']},
    {name: TemplatesAction.ADD_TEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: TemplatesAction.UPDATE_TEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: TemplatesAction.DUPLICATE_TEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: TemplatesAction.CONVERT_TEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: TemplatesAction.CONVERT_TEMPLATES, types: ['FULFILLED', 'REJECTED']},
    {name: TemplatesAction.IMPORT_TEMPLATE, types: ['FULFILLED', 'REJECTED',]},
    {name: TemplatesAction.EXPORT_TEMPLATE, types: ['FULFILLED', 'REJECTED',]},
    {name: TemplatesAction.DELETE_TEMPLATE, types: ['FULFILLED', 'REJECTED',]},
    {name: TemplatesAction.DELETE_TEMPLATES, types: ['FULFILLED', 'REJECTED',]},
    {name: WebHooksAction.ADD_WEBHOOK, types: ['FULFILLED', 'REJECTED',]},
    {name: WebHooksAction.DELETE_WEBHOOK, types: ['FULFILLED', 'REJECTED',]},
    {name: WebHooksAction.COPYTOCLIPBOARD_WEBHOOK, types: ['FULFILLED']},
    {name: AppsAction.CHECK_APP, types: ['REJECTED']},
    {name: AdminCardsAction.LOAD_ADMINCARD, types: ['REJECTED']},
    {name: InvokersAction.ADD_INVOKER, types: ['FULFILLED', 'REJECTED']},
    {name: InvokersAction.DELETE_INVOKER, types: ['FULFILLED', 'REJECTED']},
    {name: InvokersAction.DELETE_INVOKERS, types: ['FULFILLED', 'REJECTED']},
    {name: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES, types: ['REJECTED']},
    {name: NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATES, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.FETCH_UPDATEAPPVERSION, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.FETCH_ONLINEUPDATES, types: ['REJECTED']},
    {name: SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE, types: ['FULFILLED']},
    {name: UpdateAssistantAction.FETCH_OFFLINEUPDATES, types: ['REJECTED']},
    {name: UpdateAssistantAction.UPLOAD_VERSION, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.DELETE_VERSION, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.UPDATE_SYSTEM, types: ['FULFILLED', 'REJECTED']},
    {name: UpdateAssistantAction.FETCH_SYSTEMREQUIREMENTS, types: ['REJECTED']},
];

/**
 * type of notifications
 */
export const NotificationType = {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    NOTE: 'NOTE'
};

/**
 * makes text bold
 */
function boldMessage(message){
    return <b>{message}</b>;
}

/**
 * handlers for notification messages
 */
export const NotificationMessageHandlers = {};
const SuccessInterpolates = {
    FETCH_UPDATEAPPVERSION: (params) => {
        return <AvailableUpdateMessage {...params}/>
    },
    FETCH_SUBSCRIPTIONUPDATE: (params) => {
        return <AvailableSubscriptionUpdateMessage {...params}/>
    },
    CHANGE_LANGUAGE: '',
};
NotificationMessageHandlers[NotificationType.SUCCESS] = SuccessInterpolates;
