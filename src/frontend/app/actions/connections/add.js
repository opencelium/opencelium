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

import { ConnectionsAction } from '@utils/actions';


/**
 * create a new connection
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const addConnection = (connection) => {
    return {
        type: ConnectionsAction.ADD_CONNECTION,
        payload: connection,
    };
};

/**
 * create a new connection fulfilled
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const addConnectionFulfilled = (connection) => {
    return {
        type: ConnectionsAction.ADD_CONNECTION_FULFILLED,
        payload: connection,
    };
};

/**
 * create a new connection rejected
 * @param error
 * @returns {promise}
 */
const addConnectionRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectionsAction.ADD_CONNECTION_REJECTED,
        payload: error
    });
};


export{
    addConnection,
    addConnectionFulfilled,
    addConnectionRejected,
};