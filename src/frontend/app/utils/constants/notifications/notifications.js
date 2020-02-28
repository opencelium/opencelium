/*
 * Copyright (C) <2020>  <becon GmbH>
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
import { Trans } from 'react-i18next';

import {
    UsersAction, UserGroupsAction, AuthAction, AppAction, ConnectorsAction,
    ConnectionsAction, SchedulesAction, TemplatesAction, WebHooksAction,
    AppsAction, AdminCardsAction, InvokersAction,
} from '../../actions';


/**
 * notification constants to define what requests should be notified after execution
 */
export const EntitiesWithNotification = [
    {name: UsersAction.ADD_USER, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UsersAction.ADD_PROFILEPICTURE, types: ['FULFILLED']},
    {name: UsersAction.FETCH_USERS, types: ['FULFILLED', 'REJECTED']},
    {name: UsersAction.UPDATE_USER, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UsersAction.UPDATE_PROFILEPICTURE, types: ['FULFILLED']},
    {name: UsersAction.UPDATE_USERDETAIL, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UsersAction.DELETE_USER, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UserGroupsAction.ADD_USERGROUP, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UserGroupsAction.ADD_GROUPICON, types: ['FULFILLED']},
    {name: UserGroupsAction.FETCH_USERGROUPS, types: ['FULFILLED', 'REJECTED']},
    {name: UserGroupsAction.UPDATE_USERGROUP, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: UserGroupsAction.UPDATE_GROUPICON, types: ['FULFILLED']},
    {name: UserGroupsAction.DELETE_USERGROUP, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: AuthAction.LOG_IN, types: ['REJECTED']},
    {name: AuthAction.SESSION_EXPIRED, types: ['CANCELED']},
    {name: AuthAction.UPDATE_AUTH_USER_LANGUAGE, types: ['FULFILLED', 'REJECTED']},
    {name: AppAction.DO_REQUEST, types: ['REJECTED']},
    {name: ConnectorsAction.TEST_CONNECTOR, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectorsAction.ADD_CONNECTOR, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectorsAction.FETCH_CONNECTORS, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectorsAction.UPDATE_CONNECTOR, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectorsAction.DELETE_CONNECTOR, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectionsAction.ADD_CONNECTION, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectionsAction.FETCH_CONNECTIONS, types: ['FULFILLED', 'REJECTED']},
    {name: ConnectionsAction.UPDATE_CONNECTION, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectionsAction.DELETE_CONNECTION, types: ['FULFILLED', 'REJECTED', 'STORE']},
    {name: ConnectionsAction.CHECK_NEO4J, types: ['REJECTED']},
    {name: SchedulesAction.TRIGGER_SCHEDULE, types: ['FULFILLED', 'REJECTED']},
    {name: SchedulesAction.TRIGGER_SCHEDULESUCCESS, types: ['FULFILLED']},
    {name: SchedulesAction.ADD_SCHEDULE, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.FETCH_SCHEDULES, types: ['FULFILLED', 'REJECTED']},
    {name: SchedulesAction.DELETE_SCHEDULE, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.UPDATE_SCHEDULE, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.UPDATE_SCHEDULESTATUS, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.DELETE_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.ENABLE_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.DISABLE_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: SchedulesAction.START_SCHEDULES, types: ['FULFILLED', 'REJECTED',]},
    {name: TemplatesAction.FETCH_TEMPLATES, types: ['FULFILLED', 'REJECTED']},
    {name: TemplatesAction.ADD_TEMPLATE, types: ['FULFILLED', 'REJECTED']},
    {name: TemplatesAction.IMPORT_TEMPLATE, types: ['FULFILLED', 'REJECTED',]},
    {name: TemplatesAction.DELETE_TEMPLATE, types: ['FULFILLED', 'REJECTED',]},
    {name: WebHooksAction.ADD_WEBHOOK, types: ['FULFILLED', 'REJECTED',]},
    {name: WebHooksAction.DELETE_WEBHOOK, types: ['FULFILLED', 'REJECTED',]},
    {name: WebHooksAction.COPYTOCLIPBOARD_WEBHOOK, types: ['FULFILLED']},
    {name: AppsAction.CHECK_APP, types: ['REJECTED']},
    {name: AdminCardsAction.LOAD_ADMINCARD, types: ['REJECTED']},
    {name: InvokersAction.ADD_INVOKER, types: ['FULFILLED', 'REJECTED']},
    {name: InvokersAction.DELETE_INVOKER, types: ['FULFILLED', 'REJECTED']},
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
    ADD_USER: (params) => {
        const {name} = params.userDetail;
        return (
            <Trans i18nKey="notifications:SUCCESS.ADD_USER" name={name}>
                The user <strong>{name}</strong> was successfully added.
            </Trans>
        );
    },
    CHANGE_LANGUAGE: '',
};
NotificationMessageHandlers[NotificationType.SUCCESS] = SuccessInterpolates;
