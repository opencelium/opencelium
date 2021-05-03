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
 * create a new schedule
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const addSchedule = (schedule) => {
    return {
        type: SchedulesAction.ADD_SCHEDULE,
        payload: schedule,
    };
};

/**
 * create a new schedule fulfilled
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const addScheduleFulfilled = (schedule) => {
    return {
        type: SchedulesAction.ADD_SCHEDULE_FULFILLED,
        payload: schedule,
    };
};

/**
 * create a new schedule rejected
 * @param error
 * @returns {promise}
 */
const addScheduleRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.ADD_SCHEDULE_REJECTED,
        payload: error
    });
};

/**
 * create a new schedule notification
 * @param notification
 * @returns {{type: string, payload: {}}}
 */
const addScheduleNotification = (notification) => {
    return {
        type: SchedulesAction.ADD_SCHEDULENOTIFICATION,
        payload: notification,
    };
};

/**
 * create a new schedule notification fulfilled
 * @param notification
 * @returns {{type: string, payload: {}}}
 */
const addScheduleNotificationFulfilled = (notification) => {
    return {
        type: SchedulesAction.ADD_SCHEDULENOTIFICATION_FULFILLED,
        payload: notification,
    };
};

/**
 * create a new schedule notification rejected
 * @param error
 * @returns {promise}
 */
const addScheduleNotificationRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.ADD_SCHEDULENOTIFICATION_REJECTED,
        payload: error
    });
};



export{
    addSchedule,
    addScheduleFulfilled,
    addScheduleRejected,
    addScheduleNotification,
    addScheduleNotificationFulfilled,
    addScheduleNotificationRejected,
};