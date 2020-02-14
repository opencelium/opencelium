/*
 * Copyright (C) <2019>  <becon GmbH>
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

import { ConnectionsAction } from '../../utils/actions';


/**
 * check uniqueness of the title
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const checkConnectionTitle = (connection) => {
    return {
        type: ConnectionsAction.CHECK_CONNECTIONTITLE,
        payload: connection,
    };
};

/**
 * check uniqueness of the title fulfilled
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const checkConnectionTitleFulfilled = (connection) => {
    return {
        type: ConnectionsAction.CHECK_CONNECTIONTITLE_FULFILLED,
        payload: connection,
    };
};

/**
 * check uniqueness of the title rejected
 * @param error
 * @returns {promise}
 */
const checkConnectionTitleRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectionsAction.CHECK_CONNECTIONTITLE_REJECTED,
        payload: error
    });
};

/**
 * fetch connection
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const fetchConnection = (connection) => {
    return {
        type: ConnectionsAction.FETCH_CONNECTION,
        payload: connection,
    };
};

/**
 * fetch connection fulfilled
 * @param connection
 * @returns {{type: string, payload: {}}}
 */
const fetchConnectionFulfilled = (connection) => {
    return {
        type: ConnectionsAction.FETCH_CONNECTION_FULFILLED,
        payload: connection,
    };
};

/**
 * fetch connection rejected
 * @param error
 * @returns {promise}
 */
const fetchConnectionRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectionsAction.FETCH_CONNECTION_REJECTED,
        payload: error
    });
};

/**
 * fetch connection canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchConnectionCanceled = (message) => {
    return {
        type: ConnectionsAction.FETCH_CONNECTION_CANCELED,
        payload: message,
    };
};

/**
 * fetch all connections
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, settings: {}}}
 */
const fetchConnections = (settings = {}) => {
    return {
        type: ConnectionsAction.FETCH_CONNECTIONS,
        settings,
    };
};


/**
 * fetch all connection fulfilled
 * @param connections
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: [], settings: {}}}
 */
const fetchConnectionsFulfilled = (connections, settings = {}) => {
    return{
        type: ConnectionsAction.FETCH_CONNECTIONS_FULFILLED,
        payload: connections,
        settings,
    };
};

/**
 * fetch all connections rejected
 * @param error
 * @returns {*}
 */
const fetchConnectionsRejected = (error) => {
    return Rx.Observable.of({
        type: ConnectionsAction.FETCH_CONNECTIONS_REJECTED,
        payload: error
    });
};

/**
 * cancel fetching all connections
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchConnectionsCanceled = (message) => {
    return {
        type: ConnectionsAction.FETCH_CONNECTIONS_CANCELED,
        payload: message
    };
};


export {
    fetchConnection,
    fetchConnectionRejected,
    fetchConnectionFulfilled,
    fetchConnectionCanceled,
    fetchConnections,
    fetchConnectionsFulfilled,
    fetchConnectionsRejected,
    fetchConnectionsCanceled,
    checkConnectionTitle,
    checkConnectionTitleRejected,
    checkConnectionTitleFulfilled,
};