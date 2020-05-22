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

import {List, fromJS} from 'immutable';

import {SchedulesAction, WebHooksAction} from '../utils/actions';
import { addScheduleSubscriber, updateScheduleSubscriber, deleteScheduleSubscriber, deleteSchedulesSubscriber } from '../utils/socket/schedules';
import {isArray, isEmptyObject} from '../utils/app';
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    addingWebHook: false,
    deletingWebHook: false,
    triggeringScheduleSuccessfully: false,
    triggeringSchedule: false,
    fetchingSchedule: false,
    fetchingScheduleNotification: API_REQUEST_STATE.INITIAL,
    fetchingScheduleNotificationTemplates: API_REQUEST_STATE.INITIAL,
    fetchingNotificationTargetGroup: API_REQUEST_STATE.INITIAL,
    addingSchedule: API_REQUEST_STATE.INITIAL,
    addingScheduleNotification: API_REQUEST_STATE.INITIAL,
    updatingSchedule: false,
    updatingScheduleNotification: API_REQUEST_STATE.INITIAL,
    updatingScheduleStore: false,
    updatingScheduleStatus: false,
    fetchingSchedules: API_REQUEST_STATE.INITIAL,
    fetchingScheduleNotifications: API_REQUEST_STATE.INITIAL,
    fetchingSchedulesByIds: false,
    fetchingCurrentSchedules: false,
    deletingSchedule: false,
    deletingScheduleNotification: API_REQUEST_STATE.INITIAL,
    deletingSchedules: false,
    startingSchedules: false,
    enablingSchedules: false,
    disablingSchedules: false,
    testingSchedule: false,
    schedule: {},
    notification: {},
    testResult: {},
    schedules: List([]),
    targetGroup: List([]),
    notifications: List([]),
    templates: List([]),
    currentSchedules: List([]),
    error: null,
    message: {},
    isCanceled: false,
    isRejected: false,
    notificationData: {},
});

let schedules = [];
let notifications = [];
let templates = [];
let targetGroup = [];
let currentSchedules = [];
let schedulesById = [];
let schedule = {};
let index = 0;
let indexes = [];

/**
 * redux reducer for schedules (including its' webhooks and notifications)
 */

const reducer = (state = initialState, action) => {
    schedules = state.get('schedules');
    currentSchedules = state.get('currentSchedules');
    notifications = state.get('notifications');
    templates = state.get('templates');
    targetGroup = state.get('targetGroup');
    indexes = [];
    switch (action.type) {
        case SchedulesAction.TRIGGER_SCHEDULESUCCESS:
            return state.set('triggeringScheduleSuccessfully', true).set('error', null);
        case SchedulesAction.TRIGGER_SCHEDULESUCCESS_FULFILLED:
            return state.set('triggeringScheduleSuccessfully', false);
        case SchedulesAction.TRIGGER_SCHEDULE:
            return state.set('triggeringSchedule', true).set('schedule', action.payload).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.TRIGGER_SCHEDULE_FULFILLED:
            return state.set('triggeringSchedule', false);
        case SchedulesAction.TRIGGER_SCHEDULE_REJECTED:
            return state.set('triggeringSchedule', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_SCHEDULE:
            return state.set('fetchingSchedule', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_SCHEDULE_FULFILLED:
            return state.set('fetchingSchedule', false).set('schedule', action.payload);
        case SchedulesAction.FETCH_SCHEDULE_REJECTED:
            return state.set('fetchingSchedule', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATION:
            return state.set('fetchingScheduleNotification', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATION_FULFILLED:
            return state.set('fetchingScheduleNotification', API_REQUEST_STATE.FINISH).set('notification', action.payload);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATION_REJECTED:
            return state.set('fetchingScheduleNotification', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATION_CANCELED:
            return state.set('fetchingScheduleNotification', API_REQUEST_STATE.PAUSE).set('message', action.payload);
        case SchedulesAction.FETCH_SCHEDULES:
            return state.set('fetchingSchedules', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_SCHEDULES_FULFILLED:
            if(isArray(action.payload)){
                schedules = List(action.payload);
            } else{
                schedules = List([]);
            }
            return state.set('fetchingSchedules', API_REQUEST_STATE.FINISH).set('schedules', schedules).set('notifications', List([]));
        case SchedulesAction.FETCH_SCHEDULES_REJECTED:
            return state.set('fetchingSchedules', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_SCHEDULES_CANCELED:
            return state.set('fetchingSchedules', API_REQUEST_STATE.PAUSE).set('isCanceled', true).set('message', action.payload);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONS:
            return state.set('fetchingScheduleNotifications', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONS_FULFILLED:
            if(isArray(action.payload)){
                notifications = List(action.payload);
            } else{
                notifications = List([]);
            }
            return state.set('fetchingScheduleNotifications', API_REQUEST_STATE.FINISH).set('notifications', notifications);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONS_REJECTED:
            return state.set('fetchingScheduleNotifications', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONS_CANCELED:
            return state.set('fetchingScheduleNotifications', API_REQUEST_STATE.PAUSE).set('isCanceled', true).set('message', action.payload);

        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES:
            return state.set('fetchingScheduleNotificationTemplates', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES_FULFILLED:
            if(isArray(action.payload)){
                templates = List(action.payload);
            } else{
                templates = List([]);
            }
            return state.set('fetchingScheduleNotificationTemplates', API_REQUEST_STATE.FINISH).set('templates', templates);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES_REJECTED:
            return state.set('fetchingScheduleNotificationTemplates', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES_CANCELED:
            return state.set('fetchingScheduleNotificationTemplates', API_REQUEST_STATE.PAUSE).set('isCanceled', true).set('message', action.payload);

        case SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS:
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS_FULFILLED:
            if(isArray(action.payload)){
                targetGroup = List(action.payload);
            } else{
                targetGroup = List([]);
            }
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.FINISH).set('targetGroup', targetGroup);
        case SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS_REJECTED:
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS_CANCELED:
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.PAUSE).set('isCanceled', true).set('message', action.payload);
        case SchedulesAction.FETCH_SLACKCHANNELS:
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_SLACKCHANNELS_FULFILLED:
            if(isArray(action.payload)){
                targetGroup = List(action.payload);
            } else{
                targetGroup = List([]);
            }
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.FINISH).set('targetGroup', targetGroup);
        case SchedulesAction.FETCH_SLACKCHANNELS_REJECTED:
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_SLACKCHANNELS_CANCELED:
            return state.set('fetchingNotificationTargetGroup', API_REQUEST_STATE.PAUSE).set('isCanceled', true).set('message', action.payload);

        case SchedulesAction.FETCH_CURRENTSCHEDULES:
            return state.set('fetchingCurrentSchedules', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_CURRENTSCHEDULES_FULFILLED:
            if(isArray(action.payload)){
                currentSchedules = List(action.payload);
            } else{
                currentSchedules = List([]);
            }
            return state.set('fetchingCurrentSchedules', false).set('currentSchedules', currentSchedules);
        case SchedulesAction.FETCH_CURRENTSCHEDULES_REJECTED:
            return state.set('fetchingCurrentSchedules', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.FETCH_CURRENTSCHEDULES_CANCELED:
            return state.set('fetchingCurrentSchedules', false).set('message', action.payload);
        case SchedulesAction.FETCH_SCHEDULESBYIDS:
            return state.set('fetchingSchedulesByIds', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.FETCH_SCHEDULESBYIDS_FULFILLED:
            if(!isArray(action.payload)){
                schedulesById = [];
            } else{
                schedulesById = action.payload;
            }
            for(let i = 0; i < schedulesById.length; i++) {
                index = schedules.findIndex(function (schedule) {
                    return schedule.schedulerId === schedulesById[i].schedulerId;
                });
                if (index >= 0) {
                    schedules = schedules.set(index, schedulesById[i]);
                }
            }
            return state.set('fetchingSchedulesByIds', false).set('schedules', schedules);
        case SchedulesAction.FETCH_SCHEDULESBYIDS_REJECTED:
            return state.set('fetchingSchedulesByIds', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.ADD_SCHEDULE:
            return state.set('addingSchedule', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.ADD_SCHEDULE_FULFILLED:
            addScheduleSubscriber(action.payload);
            return state.set('addingSchedule', API_REQUEST_STATE.FINISH).set('schedules', schedules.set(schedules.size, action.payload));
        case SchedulesAction.ADD_SCHEDULE_REJECTED:
            return state.set('addingSchedule', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.ADD_SCHEDULENOTIFICATION:
            return state.set('addingScheduleNotification', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.ADD_SCHEDULENOTIFICATION_FULFILLED:
            return state.set('addingScheduleNotification', API_REQUEST_STATE.FINISH).set('notifications', notifications.set(notifications.size, action.payload));
        case SchedulesAction.ADD_SCHEDULENOTIFICATION_REJECTED:
            return state.set('addingScheduleNotification', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.UPDATE_SCHEDULE:
            return state.set('updatingSchedule', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.UPDATE_SCHEDULE_FULFILLED:
            updateScheduleSubscriber(action.payload);
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.schedulerId;
            });
            if(index >= 0) {
                return state.set('updatingSchedule', false).set('schedules', schedules.set(index, action.payload));
            }
            return state.set('updatingSchedule', false);
        case SchedulesAction.UPDATE_SCHEDULE_REJECTED:
            return state.set('updatingSchedule', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.UPDATE_SCHEDULE_STORE:
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.id;
            });
            if(index >= 0) {
                return state.set('updatingScheduleStore', false).set('schedules', schedules.set(index, action.payload));
            }
            return state.set('updatingScheduleStore', true);
        case SchedulesAction.UPDATE_SCHEDULENOTIFICATION:
            return state.set('updatingScheduleNotification', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.UPDATE_SCHEDULENOTIFICATION_FULFILLED:
            index = notifications.findIndex(function (notification) {
                return notification.notificationId === action.payload.notificationId;
            });
            if(index >= 0) {
                return state.set('updatingScheduleNotification', API_REQUEST_STATE.FINISH).set('notifications', notifications.set(index, action.payload));
            }
            return state.set('updatingScheduleNotification', API_REQUEST_STATE.FINISH);
        case SchedulesAction.UPDATE_SCHEDULENOTIFICATION_REJECTED:
            return state.set('updatingScheduleNotification', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.UPDATE_SCHEDULESTATUS:
            return state.set('updatingScheduleStatus', true).set('isRejected', false).set('isCanceled', false).set('schedule', action.payload).set('error', null);
        case SchedulesAction.UPDATE_SCHEDULESTATUS_FULFILLED:
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.id;
            });
            if(index >= 0) {
                schedule = schedules.get(index);
                schedule.status = action.payload.status;
                return state.set('updatingScheduleStatus', false).set('schedule', action.payload).set('schedules', schedules.set(index, schedule));
            }
            return state.set('updatingScheduleStatus', false);
        case SchedulesAction.UPDATE_SCHEDULESTATUS_REJECTED:
            return state.set('updatingScheduleStatus', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.DELETE_SCHEDULE:
            return state.set('deletingSchedule', true).set('isRejected', false).set('isCanceled', false).set('error', null).set('schedule', action.payload);
        case SchedulesAction.DELETE_SCHEDULE_FULFILLED:
            deleteScheduleSubscriber(action.payload);
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.id;
            });
            if(index >= 0) {
                return state.set('deletingSchedule', false).set('schedules', schedules.delete(index));
            }
            return state.set('deletingSchedule', false);
        case SchedulesAction.DELETE_SCHEDULE_REJECTED:
            return state.set('deletingSchedule', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.DELETE_SCHEDULENOTIFICATION:
            return state.set('deletingScheduleNotification', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null).set('notification', action.payload);
        case SchedulesAction.DELETE_SCHEDULENOTIFICATION_FULFILLED:
            index = notifications.findIndex(function (notification) {
                return notification.notificationId === action.payload.id;
            });
            if(index >= 0) {
                return state.set('deletingScheduleNotification', API_REQUEST_STATE.FINISH).set('notifications', notifications.delete(index));
            }
            return state.set('deletingScheduleNotification', API_REQUEST_STATE.FINISH);
        case SchedulesAction.DELETE_SCHEDULENOTIFICATION_REJECTED:
            return state.set('deletingScheduleNotification', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.DELETE_SCHEDULES:
            return state.set('deletingSchedules', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.DELETE_SCHEDULES_FULFILLED:
            deleteSchedulesSubscriber(action.payload);
            for(let i = 0; i < action.payload.schedulerIds.length; i++) {
                indexes.push(schedules.findIndex(function (schedule) {
                    return schedule.schedulerId === action.payload.schedulerIds[i];
                }));
            }
            if(indexes.length >= 0) {
                for(let i = indexes.length - 1; i >= 0; i--){
                    if(indexes[i] >= 0) {
                        schedules = schedules.delete(indexes[i]);
                    }
                }
                return state.set('deletingSchedules', false).set('schedules', schedules);
            }
            return state.set('deletingSchedules', false);
        case SchedulesAction.DELETE_SCHEDULES_REJECTED:
            return state.set('deletingSchedules', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.START_SCHEDULES:
            return state.set('startingSchedules', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.START_SCHEDULES_FULFILLED:
            return state.set('startingSchedules', false);
        case SchedulesAction.START_SCHEDULES_REJECTED:
            return state.set('startingSchedules', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.ENABLE_SCHEDULES:
            return state.set('enablingSchedules', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.ENABLE_SCHEDULES_FULFILLED:
            for(let i = 0; i < action.payload.schedulerIds.length; i++) {
                indexes.push(schedules.findIndex(function (schedule) {
                    return schedule.schedulerId === action.payload.schedulerIds[i];
                }));
            }
            schedules = schedules.toJS();
            if(indexes.length >= 0) {
                for(let i = 0; i < indexes.length; i++){
                    if(indexes[i] >= 0) {
                        schedules[indexes[i]].status = true;
                    }
                }
                return state.set('enablingSchedules', false).set('schedules', List(schedules));
            }
            return state.set('enablingSchedules', false);
        case SchedulesAction.ENABLE_SCHEDULES_REJECTED:
            return state.set('enablingSchedules', false).set('isRejected', true).set('error', action.payload);
        case SchedulesAction.DISABLE_SCHEDULES:
            return state.set('disablingSchedules', true).set('isRejected', false).set('isCanceled', false).set('error', null);
        case SchedulesAction.DISABLE_SCHEDULES_FULFILLED:
            for(let i = 0; i < action.payload.schedulerIds.length; i++) {
                indexes.push(schedules.findIndex(function (schedule) {
                    return schedule.schedulerId === action.payload.schedulerIds[i];
                }));
            }
            schedules = schedules.toJS();
            if(indexes.length >= 0) {
                for(let i = 0; i < indexes.length; i++){
                    if(indexes[i] >= 0) {
                        schedules[indexes[i]].status = false;
                    }
                }
                return state.set('disablingSchedules', false).set('schedules', List(schedules));
            }
            return state.set('disablingSchedules', false);
        case SchedulesAction.DISABLE_SCHEDULES_REJECTED:
            return state.set('disablingSchedules', false).set('isRejected', true).set('error', action.payload);
        case WebHooksAction.ADD_WEBHOOK:
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.schedule.id;
            });
            if(index >= 0) {
                schedule = schedules.get(index);
                return state.set('addingWebHook', true).set('schedule', schedule).set('error', null);
            }
            return state.set('addingWebHook', true).set('error', null);
        case WebHooksAction.ADD_WEBHOOK_FULFILLED:
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.id;
            });
            if(index >= 0) {
                schedule = schedules.get(index);
                schedule.webhook = action.payload.webhook;
                return state.set('addingWebHook', false).set('schedules', schedules.set(index, schedule));
            }
            return state.set('addingWebHook', false);
        case WebHooksAction.ADD_WEBHOOK_REJECTED:
            return state.set('addingWebHook', false).set('error', action.payload);
        case WebHooksAction.DELETE_WEBHOOK:
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.schedulerId;
            });
            if(index >= 0) {
                schedule = schedules.get(index);
                return state.set('deletingWebHook', true).set('schedule', schedule);
            }
            return state.set('deletingWebHook', true).set('error', null);
        case WebHooksAction.DELETE_WEBHOOK_FULFILLED:
            index = schedules.findIndex(function (schedule) {
                return schedule.schedulerId === action.payload.schedulerId;
            });
            if(index >= 0) {
                schedule = schedules.get(index);
                schedule.webhook = null;
                return state.set('deletingWebHook', false).set('schedules', schedules.set(index, schedule));
            }
            return state.set('deletingWebHook', false);
        case WebHooksAction.DELETE_WEBHOOK_REJECTED:
            return state.set('deletingWebHook', false).set('error', action.payload);
        case WebHooksAction.COPYTOCLIPBOARD_WEBHOOK_FULFILLED:
            return state;
        default:
            return state;
    }
};


export {initialState, reducer as schedules};