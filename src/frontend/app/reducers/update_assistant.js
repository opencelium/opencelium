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
    currentVersion: null,
    updateAppVersion: '',
    onlineUpdates: List([]),
    offlineUpdates: List([]),
    updatedTemplates: List([]),
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
        case UpdateAssistantAction.FETCH_OFFLINEUPDATES:
            return state.set('fetchingOfflineUpdates', API_REQUEST_STATE.START).set('error', null);
        case UpdateAssistantAction.FETCH_OFFLINEUPDATES_FULFILLED:
            return state.set('fetchingOfflineUpdates', API_REQUEST_STATE.FINISH).set('offlineUpdates', List(action.payload));
        case UpdateAssistantAction.FETCH_OFFLINEUPDATES_REJECTED:
            return state.set('fetchingOfflineUpdates', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case UpdateAssistantAction.DELETE_VERSION:
            return state.set('deletingVersion', API_REQUEST_STATE.START).set('currentVersion', action.payload).set('error', null);
        case UpdateAssistantAction.DELETE_VERSION_FULFILLED:
            index = offlineUpdates.findIndex(function (version) {
                return version.id === action.payload.id;
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
            return state.set('updatingTemplates', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null).set('updatedTemplates', List(action.payload));
        case UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT_FULFILLED:
            for(let i = 0; i < action.payload.oldTemplates.length; i++){
                index = templates.findIndex(function (template) {
                    return template.templateId === action.payload.oldTemplates[i].templateId;
                });
                if(index >= 0) {
                    templates = templates.set(index, action.payload.newTemplates[i]);
                }
                index = updatedTemplates.findIndex(function (template) {
                    return template.templateId === action.payload.oldTemplates[i].templateId;
                });
                if(index >= 0) {
                    updatedTemplates = updatedTemplates.delete(index);
                }
            }
            return state.set('updatingTemplates', API_REQUEST_STATE.FINISH).set('templates', templates).set('updatedTemplates', updatedTemplates);
        case UpdateAssistantAction.UPDATE_TEMPLATESFORASSISTANT_REJECTED:
            return state.set('updatingTemplates', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload).set('updatedTemplates', List([]));
        case UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT:
            return state.set('updatingInvokers', API_REQUEST_STATE.START).set('isRejected', false).set('isCanceled', false).set('error', null).set('updatedInvokers', List(action.payload));
        case UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT_FULFILLED:
            for(let i = 0; i < action.payload.oldInvokers.length; i++){
                index = templates.findIndex(function (template) {
                    return template.templateId === action.payload.oldInvokers[i].templateId;
                });
                if(index >= 0) {
                    templates = templates.set(index, action.payload.newInvokers[i]);
                }
                index = updatedInvokers.findIndex(function (template) {
                    return template.templateId === action.payload.oldInvokers[i].templateId;
                });
                if(index >= 0) {
                    updatedInvokers = updatedInvokers.delete(index);
                }
            }
            return state.set('updatingInvokers', API_REQUEST_STATE.FINISH).set('templates', invokers).set('updatedTemplates', updatedInvokers);
        case UpdateAssistantAction.UPDATE_INVOKERSFORASSISTANT_REJECTED:
            return state.set('updatingInvokers', API_REQUEST_STATE.ERROR).set('isRejected', true).set('error', action.payload).set('updatedInvokers', List([]));
        default:
            return state;
    }
};


export {initialState, reducer as update_assistant};