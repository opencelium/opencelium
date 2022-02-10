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

import {List, fromJS} from 'immutable';

import {ConnectionsAction} from '@utils/actions';
import { addConnectionSubscriber, updateConnectionSubscriber, deleteConnectionSubscriber } from '@utils/socket/connections';
import {isEmptyObject} from "@utils/app";
import {API_REQUEST_STATE} from "@utils/constants/app";

const initialState = fromJS({
    fetchingConnection: API_REQUEST_STATE.INITIAL,
    addingConnection: API_REQUEST_STATE.INITIAL,
    updatingConnection: API_REQUEST_STATE.INITIAL,
    fetchingConnections: API_REQUEST_STATE.INITIAL,
    deletingConnection: API_REQUEST_STATE.INITIAL,
    deletingConnections: API_REQUEST_STATE.INITIAL,
    testingConnection: API_REQUEST_STATE.INITIAL,
    checkingConnection: API_REQUEST_STATE.INITIAL,
    sendingOperationRequest: API_REQUEST_STATE.INITIAL,
    checkingNeo4j: false,
    checkingConnectionTitle: API_REQUEST_STATE.INITIAL,
    loginingGraphQL: API_REQUEST_STATE.INITIAL,
    checkTitleResult: null,
    validatingFormMethods: false,
    validateFormMethodsResult: null,
    connection: null,
    testResult: {},
    operationResponse: {},
    connections: List(),
    error: null,
    message: {},
    notificationData: {},
    checkConnectionResult: {},
    graphQLAccessToken: '',
});

let connections = [];
let connection = {};
let index = 0;
let indexes = [];

/**
 * redux reducer for connections
 */
const reducer = (state = initialState, action) => {
    connections = state.get('connections');
    indexes = [];
    switch (action.type) {
        case ConnectionsAction.CHECK_NEO4J:
            return state.set('checkingNeo4j', true).set('error', null);
        case ConnectionsAction.CHECK_NEO4J_FULFILLED:
            return state.set('checkingNeo4j', false);
        case ConnectionsAction.CHECK_NEO4J_REJECTED:
            return state.set('checkingNeo4j', false).set('error', action.payload);
        case ConnectionsAction.VALIDATE_FORMMETHODS:
            return state.set('validatingFormMethods', true).set('validateFormMethodsResult', null).set('error', null);
        case ConnectionsAction.VALIDATE_FORMMETHODS_FULFILLED:
            return state.set('validatingFormMethods', false).set('validateFormMethodsResult', action.payload);
        case ConnectionsAction.VALIDATE_FORMMETHODS_REJECTED:
            return state.set('validatingFormMethods', false).set('error', null).set('validateFormMethodsResult', action.payload);
        case ConnectionsAction.CHECK_CONNECTIONTITLE:
            return state.set('checkingConnectionTitle', API_REQUEST_STATE.START).set('checkTitleResult', null).set('error', null);
        case ConnectionsAction.CHECK_CONNECTIONTITLE_FULFILLED:
            return state.set('checkingConnectionTitle', API_REQUEST_STATE.FINISH).set('checkTitleResult', action.payload);
        case ConnectionsAction.CHECK_CONNECTIONTITLE_REJECTED:
            return state.set('checkingConnectionTitle', API_REQUEST_STATE.ERROR).set('error', null).set('checkTitleResult', action.payload);
        case ConnectionsAction.FETCH_CONNECTION:
            return state.set('fetchingConnection', API_REQUEST_STATE.START).set('error', null);
        case ConnectionsAction.FETCH_CONNECTION_FULFILLED:
            return state.set('fetchingConnection', API_REQUEST_STATE.FINISH).set('connection', action.payload);
        case ConnectionsAction.FETCH_CONNECTION_REJECTED:
            return state.set('fetchingConnection', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectionsAction.FETCH_METACONNECTIONS:
        case ConnectionsAction.FETCH_CONNECTIONS:
            return state.set('fetchingConnections', API_REQUEST_STATE.START).set('error', null);
        case ConnectionsAction.FETCH_METACONNECTIONS_FULFILLED:
        case ConnectionsAction.FETCH_CONNECTIONS_FULFILLED:
            if(isEmptyObject(action.payload)){
                return state.set('fetchingConnections', API_REQUEST_STATE.FINISH).set('connections', List([]));
            }
            return state.set('fetchingConnections', API_REQUEST_STATE.FINISH).set('connections', List(action.payload));
        case ConnectionsAction.FETCH_METACONNECTIONS_REJECTED:
        case ConnectionsAction.FETCH_CONNECTIONS_REJECTED:
            return state.set('fetchingConnections', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectionsAction.FETCH_METACONNECTIONS_CANCELED:
        case ConnectionsAction.FETCH_CONNECTIONS_CANCELED:
            return state.set('fetchingConnections', API_REQUEST_STATE.PAUSE).set('message', action.payload);
        case ConnectionsAction.ADD_CONNECTION:
            return state.set('addingConnection', API_REQUEST_STATE.START).set('error', null);
        case ConnectionsAction.ADD_CONNECTION_FULFILLED:
            addConnectionSubscriber(action.payload);
            return state.set('addingConnection', API_REQUEST_STATE.FINISH).set('connections', connections.set(connections.size, action.payload));
        case ConnectionsAction.ADD_CONNECTION_REJECTED:
            return state.set('addingConnection', API_REQUEST_STATE.ERROR).set('error', action.payload.response);
        case ConnectionsAction.UPDATE_CONNECTION:
            return state.set('updatingConnection', API_REQUEST_STATE.START).set('error', null);
        case ConnectionsAction.UPDATE_CONNECTION_FULFILLED:
            updateConnectionSubscriber(action.payload);
            index = connections.findIndex(function (connection) {
                return connection.connectionId === action.payload.connectionId;
            });
            if(index >= 0) {
                connection = connections.get(index);
                connection.email = action.payload.email;
                return state.set('updatingConnection', API_REQUEST_STATE.FINISH).set('connections', connections.set(index, connection));
            }
            return state.set('updatingConnection', API_REQUEST_STATE.FINISH);
        case ConnectionsAction.UPDATE_CONNECTION_REJECTED:
            return state.set('updatingConnection', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectionsAction.DELETE_CONNECTION:
            return state.set('deletingConnection', API_REQUEST_STATE.START).set('error', null).set('connection', action.payload);
        case ConnectionsAction.DELETE_CONNECTION_FULFILLED:
            deleteConnectionSubscriber(action.payload);
            index = connections.findIndex(function (connection) {
                return connection.connectionId === action.payload.connectionId;
            });
            if(index >= 0) {
                return state.set('deletingConnection', API_REQUEST_STATE.FINISH).set('connections', connections.delete(index)).set('connection', null);
            }
            return state.set('deletingConnection', API_REQUEST_STATE.FINISH).set('connection', null);
        case ConnectionsAction.DELETE_CONNECTION_REJECTED:
            return state.set('deletingConnection', API_REQUEST_STATE.ERROR).set('error', action.payload).set('connection', null);
        case ConnectionsAction.SEND_OPERATIONREQUEST:
            return state.set('sendingOperationRequest', API_REQUEST_STATE.START).set('error', null);
        case ConnectionsAction.SEND_OPERATIONREQUEST_FULFILLED:
            return state.set('sendingOperationRequest', API_REQUEST_STATE.FINISH).set('operationResponse', {status: action.payload.statusCodeValue, body: JSON.parse(action.payload.body)});
        case ConnectionsAction.SEND_OPERATIONREQUEST_REJECTED:
            return state.set('sendingOperationRequest', API_REQUEST_STATE.ERROR).set('error', action.payload.response);
        case ConnectionsAction.CHECK_CONNECTION:
            return state.set('checkingConnection', API_REQUEST_STATE.START).set('error', null);
        case ConnectionsAction.CHECK_CONNECTION_FULFILLED:
            return state.set('checkingConnection', API_REQUEST_STATE.FINISH).set('checkConnectionResult', action.payload);
        case ConnectionsAction.CHECK_CONNECTION_REJECTED:
            return state.set('checkingConnection', API_REQUEST_STATE.ERROR).set('error', action.payload.response);
        case ConnectionsAction.DELETE_CONNECTIONS:
            return state.set('deletingConnections', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case ConnectionsAction.DELETE_CONNECTIONS_FULFILLED:
            for(let i = 0; i < action.payload.ids.length; i++) {
                indexes.push(connections.findIndex(function (connection) {
                    return connection.connectionId === action.payload.ids[i];
                }));
            }
            if(indexes.length >= 0) {
                connections = connections.filter((u, key) => indexes.indexOf(key) === -1);
                return state.set('deletingConnections', API_REQUEST_STATE.FINISH).set('connections', connections);
            }
            return state.set('deletingConnections', API_REQUEST_STATE.FINISH);
        case ConnectionsAction.DELETE_CONNECTIONS_REJECTED:
            return state.set('deletingConnectors', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        case ConnectionsAction.LOGIN_GRAPHQL:
            return state.set('loginingGraphQL', API_REQUEST_STATE.START).set('error', null);
        case ConnectionsAction.LOGIN_GRAPHQL_FULFILLED:
            return state.set('loginingGraphQL', API_REQUEST_STATE.FINISH).set('graphQLAccessToken', JSON.parse(action.payload.body).data.authentication.login.accessToken);
        case ConnectionsAction.LOGIN_GRAPHQL_REJECTED:
            return state.set('loginingGraphQL', API_REQUEST_STATE.ERROR).set('error', action.payload.response);
        default:
            return state;
    }
};


export {initialState, reducer as connections};