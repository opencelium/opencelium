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

import {fromJS, List} from 'immutable';

import {UpdateAssistantAction} from '@utils/actions';
import {API_REQUEST_STATE} from "@utils/constants/app";


const initialState = fromJS({
    fetchingUpdateAppVersion: API_REQUEST_STATE.INITIAL,
    fetchingOnlineUpdates: API_REQUEST_STATE.INITIAL,
    fetchingOfflineUpdates: API_REQUEST_STATE.INITIAL,
    deletingVersion: API_REQUEST_STATE.INITIAL,
    uploadingVersion: API_REQUEST_STATE.INITIAL,
    updatingTemplates: API_REQUEST_STATE.INITIAL,
    updatingInvokers: API_REQUEST_STATE.INITIAL,
    updatingConnections: API_REQUEST_STATE.INITIAL,
    addingTemplatesLogs: API_REQUEST_STATE.INITIAL,
    addingInvokersLogs: API_REQUEST_STATE.INITIAL,
    addingConnectionsLogs: API_REQUEST_STATE.INITIAL,
    checkingResetFiles: false,
    currentVersion: null,
    updateAppVersion: '',
    onlineUpdates: List([]),
    offlineUpdates: List([]),
    updatedTemplates: List([]),
    updatedInvokers: List([]),
    updatedConnections: List([]),
    templatesLogs: List([]),
    invokersLogs: List([]),
    connectionsLogs: List([]),
    checkResetFiles: null,
    systemRequirements: null,
    error: null,
    message: {},
});

/**
 * redux reducer for update assistant
 */
let index = -1;
let offlineUpdates = [];
let templates = [];
let updatedTemplates = [];
let invokers = [];
let updatedInvokers = [];
const reducer = (state = initialState, action) => {
    offlineUpdates = state.get('offlineUpdates');
    templates = state.get('templates');
    updatedTemplates = state.get('updatedTemplates');
    invokers = state.get('invokers');
    updatedInvokers = state.get('updatedInvokers');
    switch (action.type) {
        case UpdateAssistantAction.CHECK_RESETFILES:
            return state.set('checkingResetFiles', true).set('error', null);
        case UpdateAssistantAction.CHECK_RESETFILES_FULFILLED:
            return state.set('checkingResetFiles', false).set('checkResetFiles', action.payload);
        case UpdateAssistantAction.CHECK_RESETFILES_REJECTED:
            return state.set('checkingResetFiles', false).set('error', action.payload);
        case UpdateAssistantAction.FETCH_UPDATEAPPVERSION:
            return state.set('fetchingUpdateAppVersion', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.FETCH_UPDATEAPPVERSION_FULFILLED:
            return state.set('fetchingUpdateAppVersion', API_REQUEST_STATE.FINISH).set('updateAppVersion', action.payload.version);
        case UpdateAssistantAction.FETCH_UPDATEAPPVERSION_REJECTED:
            return state.set('fetchingUpdateAppVersion', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.FETCH_ONLINEUPDATES:
            return state.set('fetchingOnlineUpdates', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.FETCH_ONLINEUPDATES_FULFILLED:
            return state.set('fetchingOnlineUpdates', API_REQUEST_STATE.FINISH).set('onlineUpdates', List(action.payload));
        case UpdateAssistantAction.FETCH_ONLINEUPDATES_REJECTED:
            return state.set('fetchingOnlineUpdates', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.FETCH_ONLINEUPDATES_CANCELED:
            return state.set('fetchingOnlineUpdates', API_REQUEST_STATE.PAUSE).set('message', action.payload);
        case UpdateAssistantAction.FETCH_OFFLINEUPDATES:
            return state.set('fetchingOfflineUpdates', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.FETCH_OFFLINEUPDATES_FULFILLED:
            return state.set('fetchingOfflineUpdates', API_REQUEST_STATE.FINISH).set('offlineUpdates', List(action.payload));
        case UpdateAssistantAction.FETCH_OFFLINEUPDATES_REJECTED:
            return state.set('fetchingOfflineUpdates', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.FETCH_OFFLINEUPDATES_CANCELED:
            return state.set('fetchingOfflineUpdates', API_REQUEST_STATE.PAUSE).set('message', action.payload);
        case UpdateAssistantAction.FETCH_SYSTEMREQUIREMENTS:
            return state.set('fetchingSystemRequirements', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.FETCH_SYSTEMREQUIREMENTS_FULFILLED:
            return state.set('fetchingSystemRequirements', API_REQUEST_STATE.FINISH).set('systemRequirements', action.payload);
        case UpdateAssistantAction.FETCH_SYSTEMREQUIREMENTS_REJECTED:
            return state.set('fetchingSystemRequirements', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.DELETE_VERSION:
            return state.set('deletingVersion', API_REQUEST_STATE.START).set('currentVersion', action.payload).set('error', null);
        case UpdateAssistantAction.DELETE_VERSION_FULFILLED:
            index = offlineUpdates.findIndex(function (version) {
                return version.name === action.payload.name;
            });
            if(index >= 0) {
                return state.set('deletingVersion', API_REQUEST_STATE.FINISH).set('currentVersion', null).set('offlineUpdates', offlineUpdates.delete(index));
            }
            return state.set('deletingVersion', API_REQUEST_STATE.FINISH).set('currentVersion', null);
        case UpdateAssistantAction.DELETE_VERSION_REJECTED:
            return state.set('deletingVersion', API_REQUEST_STATE.ERROR).set('currentVersion', null).set('error', action.payload);
        case UpdateAssistantAction.UPLOAD_VERSION:
            return state.set('uploadingVersion', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.UPLOAD_VERSION_FULFILLED:
            return state.set('uploadingVersion', API_REQUEST_STATE.FINISH).set('offlineUpdates', offlineUpdates.set(offlineUpdates.size, action.payload));
        case UpdateAssistantAction.UPLOAD_VERSION_REJECTED:
            return state.set('uploadingVersion', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT:
            return state.set('updatingTemplates', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT_FULFILLED:
            return state.set('updatingTemplates', API_REQUEST_STATE.FINISH).set('updatedTemplates', List(action.payload.newTemplates));
        case UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT_REJECTED:
            return state.set('updatingTemplates', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload).set('updatedTemplates', List([]));
        case UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT:
            return state.set('updatingInvokers', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT_FULFILLED:
            return state.set('updatingInvokers', API_REQUEST_STATE.FINISH).set('updatedInvokers', List(action.payload.newInvokers));
        case UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT_REJECTED:
            return state.set('updatingInvokers', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload).set('updatedInvokers', List([]));
        case UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT:
            return state.set('updatingConnections', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT_FULFILLED:
            return state.set('updatingConnections', API_REQUEST_STATE.FINISH).set('updatedConnections', List(action.payload.newConnections));
        case UpdateAssistantAction.UPDATE_CONNECTIONSFORASSISTANT_REJECTED:
            return state.set('updatingConnections', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload).set('updatedConnections', List([]));
        case UpdateAssistantAction.ADD_CONVERTTEMPLATESLOGS:
            return state.set('addingTemplatesLogs', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.ADD_CONVERTTEMPLATESLOGS_FULFILLED:
            return state.set('addingTemplatesLogs', API_REQUEST_STATE.FINISH).set('templatesLogs', List(action.payload));
        case UpdateAssistantAction.ADD_CONVERTTEMPLATESLOGS_REJECTED:
            return state.set('addingTemplatesLogs', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.ADD_CONVERTINVOKERSLOGS:
            return state.set('addingInvokersLogs', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.ADD_CONVERTINVOKERSLOGS_FULFILLED:
            return state.set('addingInvokersLogs', API_REQUEST_STATE.FINISH).set('invokersLogs', List(action.payload));
        case UpdateAssistantAction.ADD_CONVERTINVOKERSLOGS_REJECTED:
            return state.set('addingInvokersLogs', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.ADD_CONVERTCONNECTIONSLOGS:
            return state.set('addingConnectionsLogs', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.ADD_CONVERTCONNECTIONSLOGS_FULFILLED:
            return state.set('addingConnectionsLogs', API_REQUEST_STATE.FINISH).set('connectionsLogs', List(action.payload));
        case UpdateAssistantAction.ADD_CONVERTCONNECTIONSLOGS_REJECTED:
            return state.set('addingConnectionsLogs', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.UPDATE_SYSTEM:
            return state.set('updatingSystem', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null);
        case UpdateAssistantAction.UPDATE_SYSTEM_FULFILLED:
            return state.set('updatingSystem', API_REQUEST_STATE.FINISH);
        case UpdateAssistantAction.UPDATE_SYSTEM_REJECTED:
            return state.set('updatingSystem', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as update_assistant};