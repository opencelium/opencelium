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
 * update connection
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const updateConnection = (connection) => {
    return {
        type: ConnectionsAction.UPDATE_CONNECTION,
        payload: connection,
    };
};

/**
 * update connection fulfilled
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const updateConnectionFulfilled = (connection) => {
    return {
        type: ConnectionsAction.UPDATE_CONNECTION_FULFILLED,
        payload: connection,
    };
};

/**
 * update connection rejected
 * @param error
 * @returns {promise}
 */
const updateConnectionRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectionsAction.UPDATE_CONNECTION_REJECTED,
        payload: error
    });
};



export{
    updateConnection,
    updateConnectionFulfilled,
    updateConnectionRejected,
};