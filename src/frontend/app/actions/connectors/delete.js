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

import { ConnectorsAction } from '../../utils/actions';


/**
 * delete connector
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const deleteConnector = (connector) => {
    return {
        type: ConnectorsAction.DELETE_CONNECTOR,
        payload: connector,
    };
};

/**
 * delete connector fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteConnectorFulfilled = (status) => {
    return {
        type: ConnectorsAction.DELETE_CONNECTOR_FULFILLED,
        payload: status,
    };
};

/**
 * delete connector rejected
 * @param error
 * @returns {*}
 */
const deleteConnectorRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.DELETE_CONNECTOR_REJECTED,
        payload: error
    });
};


export{
    deleteConnector,
    deleteConnectorFulfilled,
    deleteConnectorRejected
};