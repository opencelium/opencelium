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

import {socket, Connectors} from '../constants/sockets';


/**
 * subscribers and listeners for connector's action
 */
function addConnectorSubscriber(data) {
    socket.emit(Connectors.ADD_CONNECTOR, data);
}

function addConnectorListener(callback){
    socket.on(Connectors.ADD_CONNECTOR, (data) => {
        callback(data);
    });
}

function updateConnectorSubscriber(data) {
    socket.emit(Connectors.UPDATE_CONNECTOR, data);
}

function updateConnectorListener(callback){
    socket.on(Connectors.UPDATE_CONNECTOR, (data) => {
        callback(data);
    });
}
function deleteConnectorSubscriber(data) {
    socket.emit(Connectors.DELETE_CONNECTOR, data);
}

function deleteConnectorListener(callback){
    socket.on(Connectors.DELETE_CONNECTOR, (data) => {
        callback(data);
    });
}


export {
    deleteConnectorListener,
    updateConnectorListener,
    deleteConnectorSubscriber,
    updateConnectorSubscriber,
    addConnectorSubscriber,
    addConnectorListener,
};