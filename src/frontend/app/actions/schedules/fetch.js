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

import Rx from 'rxjs/Rx';

import { SchedulesAction } from '@utils/actions';


/**
 * trigger/run/execute schedule successfully
 * @returns {{type: string, payload: {}}}
 */
const triggerScheduleSuccessfully = () => {
    return {
        type: SchedulesAction.TRIGGER_SCHEDULESUCCESS,
        payload: {},
    };
};

/**
 * trigger/run/execute schedule successfully fulfilled
 * @returns {promise}
 */
const triggerScheduleSuccessfullyFulfilled = () => {
    return Rx.Observable.of({
        type: SchedulesAction.TRIGGER_SCHEDULESUCCESS_FULFILLED,
        payload: {},
    });
};

/**
 * trigger/run/execute schedule
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const triggerSchedule = (schedule) => {
    return {
        type: SchedulesAction.TRIGGER_SCHEDULE,
        payload: schedule,
    };
};
/**
 * trigger/run/execute schedule fulfilled
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const triggerScheduleFulfilled = (schedule) => {
    return {
        type: SchedulesAction.TRIGGER_SCHEDULE_FULFILLED,
        payload: schedule,
    };
};

/**
 * trigger/run/execute schedule rejected
 * @param error
 * @returns {promise}
 */
const triggerScheduleRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.TRIGGER_SCHEDULE_REJECTED,
        payload: error
    });
};

/**
 * trigger/run/execute schedule canceled
 * @param message
 * @returns {promise}
 */
const triggerScheduleCanceled = (message) => {
    return {
        type: SchedulesAction.TRIGGER_SCHEDULE_CANCELED,
        payload: message
    };
};

/**
 * fetch schedule
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const fetchSchedule = (schedule) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULE,
        payload: schedule,
    };
};
/**
 * fetch schedule fulfilled
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const fetchScheduleFulfilled = (schedule) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULE_FULFILLED,
        payload: schedule,
    };
};

/**
 * fetch schedule rejected
 * @param error
 * @returns {promise}
 */
const fetchScheduleRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_SCHEDULE_REJECTED,
        payload: error
    });
};

/**
 * fetch schedule canceled
 * @param message
 * @returns {promise}
 */
const fetchScheduleCanceled = (message) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULE_CANCELED,
        payload: message
    };
};

/**
 * fetch schedules
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string}}
 */
const fetchSchedules = (settings = {}) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULES,
        settings,
    };
};

/**
 * fetch schedules fulfilled
 * @param schedules
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: []}}
 */
const fetchSchedulesFulfilled = (schedules, settings = {}) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULES_FULFILLED,
        payload: schedules,
        settings,
    };
};

/**
 * fetch schedules rejected
 * @param error
 * @returns {promise}
 */
const fetchSchedulesRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_SCHEDULES_REJECTED,
        payload: error
    });
};

/**
 * fetch schedules canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const fetchSchedulesCanceled = (message) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULES_CANCELED,
        payload: message
    };
};

/**
 * fetch current schedules
 * @returns {{type: string}}
 */
const fetchCurrentSchedules = () => {
    return {
        type: SchedulesAction.FETCH_CURRENTSCHEDULES
    };
};

/**
 * fetch current schedules fulfilled
 * @param schedules
 * @returns {{type: string, payload: []}}
 */
const fetchCurrentSchedulesFulfilled = (schedules) => {
    return{
        type: SchedulesAction.FETCH_CURRENTSCHEDULES_FULFILLED,
        payload: schedules
    };
};

/**
 * fetch current schedules rejected
 * @param error
 * @returns {promise}
 */
const fetchCurrentSchedulesRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_CURRENTSCHEDULES_REJECTED,
        payload: error
    });
};

/**
 * fetch current schedules canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const cancelFetchCurrentSchedules = (message) => {
    return {
        type: SchedulesAction.FETCH_CURRENTSCHEDULES_CANCELED,
        payload: message
    };
};

/**
 * fetch schedules by ids
 * @returns {{type: string}}
 */
const fetchSchedulesByIds = (ids) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULESBYIDS,
        payload: ids,
    };
};

/**
 * fetch schedules by ids fulfilled
 * @param schedules
 * @returns {{type: string, payload: []}}
 */
const fetchSchedulesByIdsFulfilled = (schedules) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULESBYIDS_FULFILLED,
        payload: schedules
    };
};

/**
 * fetch schedules by ids rejected
 * @param error
 * @returns {promise}
 */
const fetchSchedulesByIdsRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_SCHEDULESBYIDS_REJECTED,
        payload: error
    });
};

/**
 * fetch schedules by ids canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const fetchSchedulesByIdsCanceled = (message) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULESBYIDS_CANCELED,
        payload: message
    };
};

/**
 * fetch schedule notification
 * @param notification
 * @returns {{type: string}}
 */
const fetchScheduleNotification = (notification) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATION,
        payload: notification,
    };
};
/**
 * fetch schedule notification fulfilled
 * @param notification
 * @returns {{type: string, payload: {}}}
 */
const fetchScheduleNotificationFulfilled = (notification) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATION_FULFILLED,
        payload: notification,
    };
};

/**
 * fetch schedule notification rejected
 * @param error
 * @returns {promise}
 */
const fetchScheduleNotificationRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATION_REJECTED,
        payload: error
    });
};

/**
 * fetch schedule notification canceled
 * @param message
 * @returns {promise}
 */
const fetchScheduleNotificationCanceled = (message) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATION_CANCELED,
        payload: message
    };
};

/**
 * fetch schedule notifications
 * @param schedule
 * @returns {{type: string}}
 */
const fetchScheduleNotifications = (schedule) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONS,
        payload: schedule,
    };
};

/**
 * fetch schedule notifications fulfilled
 * @param notifications
 * @returns {{type: string, payload: []}}
 */
const fetchScheduleNotificationsFulfilled = (notifications) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONS_FULFILLED,
        payload: notifications
    };
};

/**
 * fetch schedule notifications rejected
 * @param error
 * @returns {promise}
 */
const fetchScheduleNotificationsRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONS_REJECTED,
        payload: error
    });
};

/**
 * fetch schedule notifications canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const fetchScheduleNotificationsCanceled = (message) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONS_CANCELED,
        payload: message
    };
};

/**
 * fetch template of notifications in schedule
 * @param notification
 * @returns {{type: string}}
 */
const fetchScheduleNotificationTemplates = (notification) => {
    return {
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES,
        payload: notification,
    };
};

/**
 * fetch template of notifications in schedule fulfilled
 * @param templates
 * @returns {{type: string, payload: []}}
 */
const fetchScheduleNotificationTemplatesFulfilled = (templates) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES_FULFILLED,
        payload: templates
    };
};

/**
 * fetch template of notifications in schedule rejected
 * @param error
 * @returns {promise}
 */
const fetchScheduleNotificationTemplatesRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES_REJECTED,
        payload: error
    });
};

/**
 * fetch template of notifications in schedule canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const fetchScheduleNotificationTemplatesCanceled = (message) => {
    return{
        type: SchedulesAction.FETCH_SCHEDULENOTIFICATIONTEMPLATES_CANCELED,
        payload: message
    };
};

/**
 * fetch recipients for email notification
 * @param notification
 * @returns {{type: string}}
 */
const fetchNotificationRecipients = (notification) => {
    return {
        type: SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS,
        payload: notification,
    };
};

/**
 * fetch recipients for email notification fulfilled
 * @param recipients
 * @returns {{type: string, payload: []}}
 */
const fetchNotificationRecipientsFulfilled = (recipients) => {
    return{
        type: SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS_FULFILLED,
        payload: recipients
    };
};

/**
 * fetch recipients for email notification rejected
 * @param error
 * @returns {promise}
 */
const fetchNotificationRecipientsRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS_REJECTED,
        payload: error
    });
};

/**
 * fetch recipients for email notification canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const fetchNotificationRecipientsCanceled = (message) => {
    return{
        type: SchedulesAction.FETCH_NOTIFICATIONRECIPIENTS_CANCELED,
        payload: message
    };
};
/**
 * fetch channels for slack notification
 * @param notification
 * @returns {{type: string}}
 */
const fetchSlackChannels = (notification) => {
    return {
        type: SchedulesAction.FETCH_SLACKCHANNELS,
        payload: notification,
    };
};

/**
 * fetch channels for slack notification fulfilled
 * @param channels
 * @returns {{type: string, payload: []}}
 */
const fetchSlackChannelsFulfilled = (channels) => {
    return{
        type: SchedulesAction.FETCH_SLACKCHANNELS_FULFILLED,
        payload: channels
    };
};

/**
 * fetch channels for slack notification rejected
 * @param error
 * @returns {promise}
 */
const fetchSlackChannelsRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.FETCH_SLACKCHANNELS_REJECTED,
        payload: error
    });
};

/**
 * fetch channels for slack notification canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const fetchSlackChannelsCanceled = (message) => {
    return{
        type: SchedulesAction.FETCH_SLACKCHANNELS_CANCELED,
        payload: message
    };
};


export {
    fetchSchedules,
    fetchSchedulesFulfilled,
    fetchSchedulesRejected,
    fetchSchedulesCanceled,
    fetchSchedule,
    fetchScheduleFulfilled,
    fetchScheduleRejected,
    fetchScheduleCanceled,
    triggerSchedule,
    triggerScheduleFulfilled,
    triggerScheduleRejected,
    triggerScheduleCanceled,
    triggerScheduleSuccessfully,
    triggerScheduleSuccessfullyFulfilled,
    fetchCurrentSchedules,
    fetchCurrentSchedulesFulfilled,
    fetchCurrentSchedulesRejected,
    cancelFetchCurrentSchedules,
    fetchSchedulesByIds,
    fetchSchedulesByIdsFulfilled,
    fetchSchedulesByIdsRejected,
    fetchSchedulesByIdsCanceled,
    fetchScheduleNotification,
    fetchScheduleNotificationFulfilled,
    fetchScheduleNotificationRejected,
    fetchScheduleNotificationCanceled,
    fetchScheduleNotifications,
    fetchScheduleNotificationsFulfilled,
    fetchScheduleNotificationsRejected,
    fetchScheduleNotificationsCanceled,
    fetchScheduleNotificationTemplates,
    fetchScheduleNotificationTemplatesFulfilled,
    fetchScheduleNotificationTemplatesRejected,
    fetchScheduleNotificationTemplatesCanceled,
    fetchNotificationRecipients,
    fetchNotificationRecipientsFulfilled,
    fetchNotificationRecipientsRejected,
    fetchNotificationRecipientsCanceled,
    fetchSlackChannels,
    fetchSlackChannelsFulfilled,
    fetchSlackChannelsRejected,
    fetchSlackChannelsCanceled,
};