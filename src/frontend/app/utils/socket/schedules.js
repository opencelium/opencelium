/*
 * Copyright (C) <2019>  <becon GmbH>
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

import {socket, Schedules} from '../constants/sockets';


/**
 * subscribers and listeners for schedule's action
 */
function addScheduleSubscriber(data) {
    socket.emit(Schedules.ADD_SCHEDULE, data);
}

function addScheduleListener(callback){
    socket.on(Schedules.ADD_SCHEDULE, (data) => {
        callback(data);
    });
}

function updateScheduleSubscriber(data) {
    socket.emit(Schedules.UPDATE_SCHEDULE, data);
}

function updateScheduleListener(callback){
    socket.on(Schedules.UPDATE_SCHEDULE, (data) => {
        callback(data);
    });
}
function deleteScheduleSubscriber(data) {
    socket.emit(Schedules.DELETE_SCHEDULE, data);
}

function deleteScheduleListener(callback){
    socket.on(Schedules.DELETE_SCHEDULE, (data) => {
        callback(data);
    });
}
function deleteSchedulesSubscriber(data) {
    socket.emit(Schedules.DELETE_SCHEDULES, data);
}

function deleteSchedulesListener(callback){
    socket.on(Schedules.DELETE_SCHEDULES, (data) => {
        callback(data);
    });
}


export {
    deleteScheduleListener,
    updateScheduleListener,
    deleteScheduleSubscriber,
    updateScheduleSubscriber,
    addScheduleSubscriber,
    addScheduleListener,
    deleteSchedulesListener,
    deleteSchedulesSubscriber,
};