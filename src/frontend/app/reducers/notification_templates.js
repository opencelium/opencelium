/*
 * Copyright (C) <2021>  <becon GmbH>
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

import {List, fromJS} from 'immutable';

import {NotificationTemplatesAction} from '../utils/actions';
import {API_REQUEST_STATE} from "../utils/constants/app";
import {isArray} from "../utils/app";


const initialState = fromJS({
    fetchingNotificationTemplates: API_REQUEST_STATE.INITIAL,
    fetchingNotificationTemplate: API_REQUEST_STATE.INITIAL,
    addingNotificationTemplate: API_REQUEST_STATE.INITIAL,
    updatingNotificationTemplate: API_REQUEST_STATE.INITIAL,
    deletingNotificationTemplate: API_REQUEST_STATE.INITIAL,
    deletingNotificationTemplates: API_REQUEST_STATE.INITIAL,
    notificationTemplate: null,
    notificationTemplates: List([]),
    error: null,
    message: {},
});

let notificationTemplates = [];
let notificationTemplate = {};
let index = 0;
let indexes = [];
/**
 * redux reducer for Notification Templates
 */
const reducer = (state = initialState, action) => {
    notificationTemplates = state.get('notificationTemplates');
    indexes = [];
    switch (action.type) {
        case NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES:
            return state.set('fetchingNotificationTemplates', API_REQUEST_STATE.START).set('error', null);
        case NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES_FULFILLED:
            if(isArray(action.payload)){
                notificationTemplates = List(action.payload);
            } else{
                notificationTemplates = List([]);
            }
            return state.set('fetchingNotificationTemplates', API_REQUEST_STATE.FINISH).set('notificationTemplates', notificationTemplates);
        case NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES_REJECTED:
            return state.set('fetchingNotificationTemplates', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE:
            return state.set('fetchingNotificationTemplate', API_REQUEST_STATE.START).set('error', null);
        case NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE_FULFILLED:
            return state.set('fetchingNotificationTemplate', API_REQUEST_STATE.FINISH).set('notificationTemplate', action.payload);
        case NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE_REJECTED:
            return state.set('fetchingNotificationTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE:
            return state.set('addingNotificationTemplate', API_REQUEST_STATE.START).set('error', null);
        case NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE_FULFILLED:
            return state.set('addingNotificationTemplate', API_REQUEST_STATE.FINISH).set('notificationTemplates', notificationTemplates.set(notificationTemplates.size, action.payload));
        case NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE_REJECTED:
            return state.set('addingNotificationTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE:
            return state.set('updatingNotificationTemplate', API_REQUEST_STATE.START).set('error', null);
        case NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE_FULFILLED:
            index = notificationTemplates.findIndex(function (notificationTemplate) {
                return notificationTemplate.templateId === action.payload.id;
            });
            if(index >= 0) {
                notificationTemplate = action.payload;
                return state.set('updatingNotificationTemplate', API_REQUEST_STATE.FINISH).set('notificationTemplates', notificationTemplates.set(index, notificationTemplate));
            }
            return state.set('updatingNotificationTemplate', API_REQUEST_STATE.FINISH);
        case NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE_REJECTED:
            return state.set('updatingNotificationTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATE:
            return state.set('deletingNotificationTemplate', API_REQUEST_STATE.START).set('error', null).set('notificationTemplate', action.payload);
        case NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATE_FULFILLED:
            index = notificationTemplates.findIndex(function (notificationTemplate) {
                return notificationTemplate.templateId === action.payload.id;
            });
            if(index >= 0) {
                return state.set('deletingNotificationTemplate', API_REQUEST_STATE.FINISH).set('notificationTemplates', notificationTemplates.delete(index)).set('notificationTemplate', null);
            }
            return state.set('deletingNotificationTemplate', API_REQUEST_STATE.FINISH).set('notificationTemplate', null);
        case NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATE_REJECTED:
            return state.set('deletingNotificationTemplate', API_REQUEST_STATE.ERROR).set('error', action.payload).set('notificationTemplate', null);
        case NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATES:
            return state.set('deletingNotificationTemplates', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATES_FULFILLED:
            for(let i = 0; i < action.payload.ids.length; i++) {
                indexes.push(notificationTemplates.findIndex(function (notificationTemplate) {
                    return notificationTemplate.templateId === action.payload.ids[i];
                }));
            }
            if(indexes.length >= 0) {
                notificationTemplates = notificationTemplates.filter((u, key) => indexes.indexOf(key) === -1);
                return state.set('deletingNotificationTemplates', API_REQUEST_STATE.FINISH).set('notificationTemplates', notificationTemplates);
            }
            return state.set('deletingNotificationTemplates', API_REQUEST_STATE.FINISH);
        case NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATES_REJECTED:
            return state.set('deletingNotificationTemplates', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as notificationTemplates};