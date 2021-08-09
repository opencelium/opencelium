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
 * fetch connector
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const fetchConnector = (connector) => {
    return {
        type: ConnectorsAction.FETCH_CONNECTOR,
        payload: connector,
    };
};

/**
 * fetch connector fulfilled
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const fetchConnectorFulfilled = (connector) => {
    return {
        type: ConnectorsAction.FETCH_CONNECTOR_FULFILLED,
        payload: connector,
    };
};

/**
 * fetch connector rejected
 * @param error
 * @returns {promise}
 */
const fetchConnectorRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.FETCH_CONNECTOR_REJECTED,
        payload: error
    });
};

/**
 * fetch connector canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchConnectorCanceled = (message) => {
    return {
        type: ConnectorsAction.FETCH_CONNECTOR_CANCELED,
        payload: message
    };
};

/**
 * fetch all connectors
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string}}
 */
const fetchConnectors = (settings = {}) => {
    return {
        type: ConnectorsAction.FETCH_CONNECTORS,
        settings,
    };
};

/**
 * fetch all connectors fulfilled
 * @param connectors
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: []}}
 */
const fetchConnectorsFulfilled = (connectors, settings = {}) => {
    return{
        type: ConnectorsAction.FETCH_CONNECTORS_FULFILLED,
        payload: connectors,
        settings,
    };
};

/**
 * fetch all connectors rejected
 * @param error
 * @returns {promise}
 */
const fetchConnectorsRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.FETCH_CONNECTORS_REJECTED,
        payload: error
    });
};

/**
 * fetch all connectors canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchConnectorsCanceled = (message) => {
    return {
        type: ConnectorsAction.FETCH_CONNECTORS_CANCELED,
        payload: message
    };
};

/**
 * check uniqueness of the title
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const checkConnectorTitle = (connector) => {
    return {
        type: ConnectorsAction.CHECK_CONNECTORTITLE,
        payload: connector,
    };
};

/**
 * check uniqueness of the title fulfilled
 * @param connector
 * @returns {{type: string, payload: {}}}
 */
const checkConnectorTitleFulfilled = (connector) => {
    return {
        type: ConnectorsAction.CHECK_CONNECTORTITLE_FULFILLED,
        payload: connector,
    };
};

/**
 * check uniqueness of the title rejected
 * @param error
 * @returns {promise}
 */
const checkConnectorTitleRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectorsAction.CHECK_CONNECTORTITLE_REJECTED,
        payload: error
    });
};

export {
    fetchConnectors,
    fetchConnectorsFulfilled,
    fetchConnectorsRejected,
    fetchConnectorsCanceled,
    fetchConnector,
    fetchConnectorFulfilled,
    fetchConnectorRejected,
    fetchConnectorCanceled,
    checkConnectorTitle,
    checkConnectorTitleFulfilled,
    checkConnectorTitleRejected,
};