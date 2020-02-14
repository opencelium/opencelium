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

import {ConnectorsAction} from "../../utils/actions";


/**
 * test connector, if it can connect or not
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const testConnector = (connector) => {
    return {
        type: ConnectorsAction.TEST_CONNECTOR,
        payload: connector,
    };
};

/**
 * test connector fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const testConnectorFulfilled = (status) => {
    return {
        type: ConnectorsAction.TEST_CONNECTOR_FULFILLED,
        payload: status,
    };
};

/**
 * test connector rejected
 * @param error
 * @returns {*}
 */
const testConnectorRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.TEST_CONNECTOR_REJECTED,
        payload: error
    });
};


export {
    testConnector,
    testConnectorFulfilled,
    testConnectorRejected,
};