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

import {List, fromJS} from 'immutable';

import {AppsAction} from '../utils/actions';
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    fetchingApps: API_REQUEST_STATE.INITIAL,
    loadingAppsLink: API_REQUEST_STATE.INITIAL,
    checkingApp: API_REQUEST_STATE.INITIAL,
    checkingAppResult: null,
    app: null,
    apps: List([]),
    error: null,
    message: {},
    notificationData: {},
});

/**
 * redux reducer for applications
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case AppsAction.FETCH_APPS:
            return state.set('fetchingApps', API_REQUEST_STATE.START).set('error', null);
        case AppsAction.FETCH_APPS_FULFILLED:
            if(!Array.isArray(action.payload)){
                return state.set('fetchingApps', API_REQUEST_STATE.FINISH).set('apps', List([]));
            }
            return state.set('fetchingApps', API_REQUEST_STATE.FINISH).set('apps', List(action.payload));
        case AppsAction.FETCH_APPS_REJECTED:
            return state.set('fetchingApps', API_REQUEST_STATE.PAUSE).set('error', action.payload);
        case AppsAction.LOAD_APPSLINK:
            return state.set('loadingAppsLink', API_REQUEST_STATE.START);
        case AppsAction.LOAD_APPSLINK_FULFILLED:
            window.open(action.payload.url, '_blank').focus();
            return state.set('loadingAppsLink', API_REQUEST_STATE.FINISH);
        case AppsAction.LOAD_APPSLINK_REJECTED:
            return state.set('loadingAppsLink', API_REQUEST_STATE.ERROR);
        case AppsAction.CHECK_APP:
            return state.set('checkingApp', API_REQUEST_STATE.START).set('error', null).set('checkingAppResult', null);
        case AppsAction.CHECK_APP_FULFILLED:
            return state.set('checkingApp', API_REQUEST_STATE.FINISH).set('checkingAppResult', action.payload);
        case AppsAction.CHECK_APP_REJECTED:
            return state.set('checkingApp', API_REQUEST_STATE.PAUSE).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as apps};