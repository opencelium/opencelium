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

import Rx from 'rxjs/Rx';

import { SchedulesAction } from '../../utils/actions';


/**
 * delete schedule
 * @param schedule
 * @returns {{type: string, payload: *}}
 */
const deleteSchedule = (schedule) => {
    return {
        type: SchedulesAction.DELETE_SCHEDULE,
        payload: schedule,
    };
};

/**
 * delete schedule fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteScheduleFulfilled = (status) => {
    return {
        type: SchedulesAction.DELETE_SCHEDULE_FULFILLED,
        payload: status,
    };
};

/**
 * delete schedule rejected
 * @param error
 * @returns {promise}
 */
const deleteScheduleRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.DELETE_SCHEDULE_REJECTED,
        payload: error
    });
};

/**
 * delete schedules
 * @param schedules
 * @returns {{type: string, payload: *}}
 */
const deleteSchedules = (schedules) => {
    return {
        type: SchedulesAction.DELETE_SCHEDULES,
        payload: schedules,
    };
};

/**
 * delete schedules fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteSchedulesFulfilled = (status) => {
    return {
        type: SchedulesAction.DELETE_SCHEDULES_FULFILLED,
        payload: status,
    };
};

/**
 * delete schedules rejected
 * @param error
 * @returns {promise}
 */
const deleteSchedulesRejected = (error) => {
    return Rx.Observable.of({
        type: SchedulesAction.DELETE_SCHEDULES_REJECTED,
        payload: error
    });
};


export{
    deleteSchedule,
    deleteScheduleFulfilled,
    deleteScheduleRejected,
    deleteSchedules,
    deleteSchedulesFulfilled,
    deleteSchedulesRejected,
};