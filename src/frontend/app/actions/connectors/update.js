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

import {ConnectorsAction} from '@utils/actions';


/**
 * update connector
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const updateConnector = (connector) => {
    return {
        type: ConnectorsAction.UPDATE_CONNECTOR,
        payload: connector,
    };
};

/**
 * update connector fulfilled
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const updateConnectorFulfilled = (connector) => {
    return {
        type: ConnectorsAction.UPDATE_CONNECTOR_FULFILLED,
        payload: connector,
    };
};

/**
 * update connector rejected
 * @param error
 * @returns {promise}
 */
const updateConnectorRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.UPDATE_CONNECTOR_REJECTED,
        payload: error
    });
};


/**
 * update icon of the connector
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const updateConnectorIcon = (connector) => {
    return {
        type: ConnectorsAction.UPDATE_CONNECTORICON,
        payload: connector,
    };
};

/**
 * update icon of the connector fulfilled
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const updateConnectorIconFulfilled = (connector) => {
    return {
        type: ConnectorsAction.UPDATE_CONNECTORICON_FULFILLED,
        payload: connector,
    };
};

/**
 * update icon of the connector rejected
 * @param error
 * @returns {promise}
 */
const updateConnectorIconRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.UPDATE_CONNECTORICON_REJECTED,
        payload: error
    });
};



export{
    updateConnector,
    updateConnectorFulfilled,
    updateConnectorRejected,
    updateConnectorIcon,
    updateConnectorIconFulfilled,
    updateConnectorIconRejected,
};