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
 * create a new connector
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const addConnector = (connector) => {
    return {
        type: ConnectorsAction.ADD_CONNECTOR,
        payload: connector,
    };
};

/**
 * create a new connector fulfilled
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const addConnectorFulfilled = (connector) => {
    return {
        type: ConnectorsAction.ADD_CONNECTOR_FULFILLED,
        payload: connector,
    };
};

/**
 * create a new connector rejected
 * @param error
 * @returns {*}
 */
const addConnectorRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.ADD_CONNECTOR_REJECTED,
        payload: error
    });
};



export{
    addConnector,
    addConnectorFulfilled,
    addConnectorRejected,
};