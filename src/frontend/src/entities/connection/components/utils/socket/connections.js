/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {socket, Connections} from '../constants/sockets';


/**
 * subscribers and listeners for connection's action
 */
function addConnectionSubscriber(data) {
    socket.emit(Connections.ADD_CONNECTION, data);
}

function addConnectionListener(callback){
    socket.on(Connections.ADD_CONNECTION, (data) => {
        callback(data);
    });
}

function updateConnectionSubscriber(data) {
    socket.emit(Connections.UPDATE_CONNECTION, data);
}

function updateConnectionListener(callback){
    socket.on(Connections.UPDATE_CONNECTION, (data) => {
        callback(data);
    });
}
function deleteConnectionSubscriber(data) {
    socket.emit(Connections.DELETE_CONNECTION, data);
}

function deleteConnectionListener(callback){
    socket.on(Connections.DELETE_CONNECTION, (data) => {
        callback(data);
    });
}


export {
    deleteConnectionListener,
    updateConnectionListener,
    deleteConnectionSubscriber,
    updateConnectionSubscriber,
    addConnectionSubscriber,
    addConnectionListener,
};