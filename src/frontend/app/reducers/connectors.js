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

import {ConnectorsAction} from '@utils/actions';
import { addConnectorSubscriber, updateConnectorSubscriber, deleteConnectorSubscriber } from '@utils/socket/connectors';
import {API_REQUEST_STATE} from "@utils/constants/app";


const initialState = fromJS({
    checkingConnectorTitle: API_REQUEST_STATE.INITIAL,
    checkTitleResult: null,
    fetchingConnector: API_REQUEST_STATE.INITIAL,
    addingConnector: API_REQUEST_STATE.INITIAL,
    addingConnectorIcon: API_REQUEST_STATE.INITIAL,
    updatingConnector: API_REQUEST_STATE.INITIAL,
    updatingConnectorIcon: API_REQUEST_STATE.INITIAL,
    fetchingConnectors: API_REQUEST_STATE.INITIAL,
    deletingConnector: API_REQUEST_STATE.INITIAL,
    deletingConnectors: API_REQUEST_STATE.INITIAL,
    testingConnector: API_REQUEST_STATE.INITIAL,
    connector: {},
    testResult: null,
    connectors: List([]),
    error: null,
    message: {},
    notificationData: {},
});

let connectors = [];
let connector = {};
let index = 0;
let indexes = [];

/**
 * redux reducer for connectors
 */
const reducer = (state = initialState, action) => {
    connectors = state.get('connectors');
    indexes = [];
    switch (action.type) {
        case ConnectorsAction.CHECK_CONNECTORTITLE:
            return state.set('checkingConnectorTitle', API_REQUEST_STATE.START).set('checkTitleResult', null).set('error', null);
        case ConnectorsAction.CHECK_CONNECTORTITLE_FULFILLED:
            return state.set('checkingConnectorTitle', API_REQUEST_STATE.FINISH).set('checkTitleResult', action.payload);
        case ConnectorsAction.CHECK_CONNECTORTITLE_REJECTED:
            return state.set('checkingConnectorTitle', API_REQUEST_STATE.ERROR).set('error', null).set('checkTitleResult', action.payload);
        case ConnectorsAction.FETCH_CONNECTOR:
            return state.set('fetchingConnector', API_REQUEST_STATE.START).set('error', null);
        case ConnectorsAction.FETCH_CONNECTOR_FULFILLED:
            return state.set('fetchingConnector', API_REQUEST_STATE.FINISH).set('connector', action.payload);
        case ConnectorsAction.FETCH_CONNECTOR_REJECTED:
            return state.set('fetchingConnector', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectorsAction.FETCH_CONNECTORS:
            return state.set('fetchingConnectors', API_REQUEST_STATE.START).set('error', null);
        case ConnectorsAction.FETCH_CONNECTORS_FULFILLED:
            if(!Array.isArray(action.payload)){
                return state.set('fetchingConnectors', API_REQUEST_STATE.FINISH).set('connectors', List([]));
            }
            return state.set('fetchingConnectors', API_REQUEST_STATE.FINISH).set('connectors', List(action.payload));
        case ConnectorsAction.FETCH_CONNECTORS_REJECTED:
            return state.set('fetchingConnectors', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectorsAction.FETCH_CONNECTORS_CANCELED:
            return state.set('fetchingConnectors', API_REQUEST_STATE.PAUSE).set('message', action.payload);
        case ConnectorsAction.ADD_CONNECTOR:
            return state.set('addingConnector', API_REQUEST_STATE.START).set('error', null);
        case ConnectorsAction.ADD_CONNECTOR_FULFILLED:
            addConnectorSubscriber(action.payload);
            return state.set('addingConnector', API_REQUEST_STATE.FINISH).set('connectors', connectors.set(connectors.size, action.payload));
        case ConnectorsAction.ADD_CONNECTOR_REJECTED:
            return state.set('addingConnector', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectorsAction.ADD_CONNECTORICON:
            return state.set('addingConnectorIcon', API_REQUEST_STATE.START).set('error', null);
        case ConnectorsAction.ADD_CONNECTORICON_FULFILLED:
            index = connectors.findIndex(function (connector) {
                return connector.id === action.payload.connectorId;
            });
            if(index === -1) {
                return state.set('addingConnectorIcon', API_REQUEST_STATE.FINISH).set('addingConnector', API_REQUEST_STATE.FINISH).set('connectors', connectors.set(connectors.size, action.payload));
            } else{
                connector = connectors.toJS()[index];
                connector.icon = action.payload.icon;
                return state.set('addingConnectorIcon', API_REQUEST_STATE.FINISH).set('addingConnector', API_REQUEST_STATE.FINISH).set('connectors', connectors.set(index, connector));
            }
        case ConnectorsAction.ADD_CONNECTORICON_REJECTED:
            return state.set('addingConnectorIcon', API_REQUEST_STATE.ERROR).set('addingConnector', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectorsAction.UPDATE_CONNECTOR:
            return state.set('updatingConnector', API_REQUEST_STATE.START).set('error', null);
        case ConnectorsAction.UPDATE_CONNECTOR_FULFILLED:
            updateConnectorSubscriber(action.payload);
            index = connectors.findIndex(function (connector) {
                return connector.id === action.payload.id;
            });
            if(index >= 0) {
                connector = action.payload;
                return state.set('updatingConnector', API_REQUEST_STATE.FINISH).set('connectors', connectors.set(index, connector));
            }
            return state.set('updatingConnector', API_REQUEST_STATE.FINISH);
        case ConnectorsAction.UPDATE_CONNECTOR_REJECTED:
            return state.set('updatingConnector', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectorsAction.UPDATE_CONNECTORICON:
            return state.set('updatingConnectorIcon', API_REQUEST_STATE.START).set('error', null);
        case ConnectorsAction.UPDATE_CONNECTORICON_FULFILLED:
            updateConnectorSubscriber(action.payload);
            index = connectors.findIndex(function (connector) {
                return connector.id === action.payload.id;
            });
            if(index >= 0) {
                connector = action.payload;
                return state.set('updatingConnector', API_REQUEST_STATE.FINISH).set('connectors', connectors.set(index, connector));
            }
            return state.set('updatingConnector', API_REQUEST_STATE.FINISH);
        case ConnectorsAction.UPDATE_CONNECTORICON_REJECTED:
            return state.set('updatingConnector', API_REQUEST_STATE.ERROR).set('updatingConnectorIcon', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case ConnectorsAction.DELETE_CONNECTOR:
            return state.set('deletingConnector', API_REQUEST_STATE.START).set('error', null).set('connector', action.payload);
        case ConnectorsAction.DELETE_CONNECTOR_FULFILLED:
            deleteConnectorSubscriber(action.payload);
            index = connectors.findIndex(function (connector) {
                return connector.id === action.payload.id;
            });
            if(index >= 0) {
                return state.set('deletingConnector', API_REQUEST_STATE.FINISH).set('connectors', connectors.delete(index)).set('connector', null);
            }
            return state.set('deletingConnector', API_REQUEST_STATE.FINISH).set('connector', null);
        case ConnectorsAction.DELETE_CONNECTOR_REJECTED:
            return state.set('deletingConnector', API_REQUEST_STATE.ERROR).set('error', action.payload).set('connector', null);
        case ConnectorsAction.TEST_CONNECTOR:
            return state.set('testingConnector', API_REQUEST_STATE.START).set('testResult', null).set('error', null);
        case ConnectorsAction.TEST_CONNECTOR_FULFILLED:
            return state.set('testingConnector', API_REQUEST_STATE.FINISH).set('testResult', action.payload);
        case ConnectorsAction.TEST_CONNECTOR_REJECTED:
            return state.set('testingConnector', API_REQUEST_STATE.ERROR).set('testResult', action.payload);
        case ConnectorsAction.DELETE_CONNECTORS:
            return state.set('deletingConnectors', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case ConnectorsAction.DELETE_CONNECTORS_FULFILLED:
            for(let i = 0; i < action.payload.ids.length; i++) {
                indexes.push(connectors.findIndex(function (connector) {
                    return connector.id === action.payload.ids[i];
                }));
            }
            if(indexes.length >= 0) {
                connectors = connectors.filter((u, key) => indexes.indexOf(key) === -1);
                return state.set('deletingConnectors', API_REQUEST_STATE.FINISH).set('connectors', connectors);
            }
            return state.set('deletingConnectors', API_REQUEST_STATE.FINISH);
        case ConnectorsAction.DELETE_CONNECTORS_REJECTED:
            return state.set('deletingConnectors', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as connectors};