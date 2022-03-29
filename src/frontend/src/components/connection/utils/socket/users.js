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

import {socket, Users} from '../constants/sockets';


/**
 * subscribers and listeners for user's action
 */
function addUserSubscriber(data) {
    socket.emit(Users.ADD_USER, data);
}

function addUserListener(callback){
    socket.on(Users.ADD_USER, (data) => {
        callback(data);
    });
}

function updateUserSubscriber(data) {
    socket.emit(Users.UPDATE_USER, data);
}

function updateUserListener(callback){
    socket.on(Users.UPDATE_USER, (data) => {
        callback(data);
    });
}
function updateUserDetailSubscriber(data) {
    socket.emit(Users.UPDATE_USERDETAIL, data);
}

function updateUserDetailListener(callback){
    socket.on(Users.UPDATE_USERDETAIL, (data) => {
        callback(data);
    });
}
function updateDashboardSettingsSubscriber(data) {
    socket.emit(Users.UPDATE_DASHBOARDSETTINGS, data);
}

function updateDashboardSettingsListener(callback){
    socket.on(Users.UPDATE_DASHBOARDSETTINGS, (data) => {
        callback(data);
    });
}
function deleteUserSubscriber(data) {
    socket.emit(Users.DELETE_USER, data);
}

function deleteUserListener(callback){
    socket.on(Users.DELETE_USER, (data) => {
        callback(data);
    });
}
function addPermissionSubscriber(data) {
    socket.emit(Users.ADD_PERMISSION, data);
}

function addPermissionListener(callback){
    socket.on(Users.ADD_PERMISSION, (data) => {
        callback(data);
    });
}

export {
    addPermissionListener,
    deleteUserListener,
    updateUserListener,
    deleteUserSubscriber,
    updateUserSubscriber,
    addUserSubscriber,
    addPermissionSubscriber,
    addUserListener,
    updateUserDetailSubscriber,
    updateUserDetailListener,
    updateDashboardSettingsListener,
    updateDashboardSettingsSubscriber,
};