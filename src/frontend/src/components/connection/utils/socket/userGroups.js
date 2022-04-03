

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

import {socket, UserGroups} from '../constants/sockets';


/**
 * subscribers and listeners for usergroup's action
 */
function addUserGroupSubscriber(data) {
    socket.emit(UserGroups.ADD_USERGROUP, data);
}

function addUserGroupListener(callback){
    socket.on(UserGroups.ADD_USERGROUP, (data) => {
        callback(data);
    });
}

function updateUserGroupSubscriber(data) {
    socket.emit(UserGroups.UPDATE_USERGROUP, data);
}

function updateUserGroupListener(callback){
    socket.on(UserGroups.UPDATE_USERGROUP, (data) => {
        callback(data);
    });
}
function deleteUserGroupSubscriber(data) {
    socket.emit(UserGroups.DELETE_USERGROUP, data);
}

function deleteUserGroupListener(callback){
    socket.on(UserGroups.DELETE_USERGROUP, (data) => {
        callback(data);
    });
}

export {
    deleteUserGroupListener,
    updateUserGroupListener,
    deleteUserGroupSubscriber,
    updateUserGroupSubscriber,
    addUserGroupSubscriber,
    addUserGroupListener,
};