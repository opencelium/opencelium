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
 * update schedule in Redux Store
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const updateScheduleInStore = (schedule) => {
    return {
        type: SchedulesAction.UPDATE_SCHEDULE_STORE,
        payload: schedule,
    };
};

/**
 * update schedule
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const updateSchedule = (schedule, settings = {}) => {
    return {
        type: SchedulesAction.UPDATE_SCHEDULE,
        payload: schedule,
        settings,
    };
};

/**
 * update schedule fulfilled
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const updateScheduleFulfilled = (schedule, settings = {}) => {
    return{
        type: SchedulesAction.UPDATE_SCHEDULE_FULFILLED,
        payload: schedule,
        settings,
    };
};

/**
 * update schedule rejected
 * @param error
 * @returns {promise}
 */
const updateScheduleRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.UPDATE_SCHEDULE_REJECTED,
        payload: error
    });
};

/**
 * update status of the schedule
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const updateScheduleStatus = (schedule) => {
    return {
        type: SchedulesAction.UPDATE_SCHEDULESTATUS,
        payload: schedule,
    };
};

/**
 * update status of the schedule fulfilled
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const updateScheduleStatusFulfilled = (schedule) => {
    return {
        type: SchedulesAction.UPDATE_SCHEDULESTATUS_FULFILLED,
        payload: schedule,
    };
};

/**
 * update status of the schedule rejected
 * @param error
 * @returns {promise}
 */
const updateScheduleStatusRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.UPDATE_SCHEDULESTATUS_REJECTED,
        payload: error
    });
};


/**
 * start schedulse
 * @param schedules
 * @returns {{type: string, payload: {}}}
 */
const startSchedules = (schedules) => {
    return {
        type: SchedulesAction.START_SCHEDULES,
        payload: schedules,
    };
};

/**
 * start schedules fulfilled
 * @param schedules
 * @returns {{type: string, payload: {}}}
 */
const startSchedulesFulfilled = (schedules) => {
    return {
        type: SchedulesAction.START_SCHEDULES_FULFILLED,
        payload: schedules,
    };
};

/**
 * start schedules rejected
 * @param error
 * @returns {promise}
 */
const startSchedulesRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.START_SCHEDULES_REJECTED,
        payload: error
    });
};

/**
 * enable schedulse
 * @param schedules
 * @returns {{type: string, payload: {}}}
 */
const enableSchedules = (schedules) => {
    return {
        type: SchedulesAction.ENABLE_SCHEDULES,
        payload: schedules,
    };
};

/**
 * enable schedules fulfilled
 * @param schedules
 * @returns {{type: string, payload: {}}}
 */
const enableSchedulesFulfilled = (schedules) => {
    return {
        type: SchedulesAction.ENABLE_SCHEDULES_FULFILLED,
        payload: schedules,
    };
};

/**
 * enable schedules rejected
 * @param error
 * @returns {promise}
 */
const enableSchedulesRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.ENABLE_SCHEDULES_REJECTED,
        payload: error
    });
};


/**
 * disable schedulse
 * @param schedules
 * @returns {{type: string, payload: {}}}
 */
const disableSchedules = (schedules) => {
    return {
        type: SchedulesAction.DISABLE_SCHEDULES,
        payload: schedules,
    };
};

/**
 * disable schedules fulfilled
 * @param schedules
 * @returns {{type: string, payload: {}}}
 */
const disableSchedulesFulfilled = (schedules) => {
    return {
        type: SchedulesAction.DISABLE_SCHEDULES_FULFILLED,
        payload: schedules,
    };
};

/**
 * disable schedules rejected
 * @param error
 * @returns {promise}
 */
const disableSchedulesRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.DISABLE_SCHEDULES_REJECTED,
        payload: error
    });
};

/**
 * update schedule notification
 * @param notification
 * @returns {{type: string, payload: {}}}
 */
const updateScheduleNotification = (notification, settings = {}) => {
    return {
        type: SchedulesAction.UPDATE_SCHEDULENOTIFICATION,
        payload: notification,
        settings,
    };
};

/**
 * update schedule notification fulfilled
 * @param notification
 * @returns {{type: string, payload: {}}}
 */
const updateScheduleNotificationFulfilled = (notification, settings = {}) => {
    return{
        type: SchedulesAction.UPDATE_SCHEDULENOTIFICATION_FULFILLED,
        payload: notification,
        settings,
    };
};

/**
 * update schedule notification rejected
 * @param error
 * @returns {promise}
 */
const updateScheduleNotificationRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.UPDATE_SCHEDULENOTIFICATION_REJECTED,
        payload: error
    });
};


export{
    updateScheduleInStore,
    updateSchedule,
    updateScheduleFulfilled,
    updateScheduleRejected,
    updateScheduleStatus,
    updateScheduleStatusFulfilled,
    updateScheduleStatusRejected,
    startSchedules,
    startSchedulesFulfilled,
    startSchedulesRejected,
    enableSchedules,
    enableSchedulesFulfilled,
    enableSchedulesRejected,
    disableSchedules,
    disableSchedulesFulfilled,
    disableSchedulesRejected,
    updateScheduleNotification,
    updateScheduleNotificationFulfilled,
    updateScheduleNotificationRejected,
};