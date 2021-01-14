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
    updateAppVersion: '',
    onlineUpdates: List([]),
    offlineUpdates: List([]),
    error: null,
    message: {},
});

/**
 * redux reducer for update assistant
 */
const reducer = (state = initialState, action) => {
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
        default:
            return state;
    }
};


export {initialState, reducer as update_assistant};