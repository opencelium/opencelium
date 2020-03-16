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

import {fromJS} from 'immutable';

import {AuthAction} from '../utils/actions';
import {updateDashboardSettingsSubscriber} from "../utils/socket/users";
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    authUser: {},
    isAuth: false,
    expTime: 0,
    logining: false,
    logouting: false,
    updatingDashboardSettings: false,
    togglingAppTour: false,
    updatingTheme: false,
    updatingAuthUserLanguage: false,
    checkingOCConnection: API_REQUEST_STATE.INITIAL,
    checkOCConnectionResult: null,
    error: null,
    message: {},
});

let authUser = null;

/**
 * redux reducer for auth user
 */
const reducer = (state = initialState, action) => {
    let isNotAuthButStayInSystem = false;
    switch (action.type) {
        case AuthAction.INITIAL_STATE:
            return state;
        case AuthAction.LOG_IN:
            return state.set('logining', true).set('error', null);
        case AuthAction.LOG_IN_FULFILLED:
            return state.set('logining', false).set('authUser', action.payload).set('isAuth', true);
        case AuthAction.LOG_IN_REJECTED:
            return state.set('logining', false).set('error', action.payload).set('isAuth', false);
        case AuthAction.LOG_IN_CANCELED:
            return state.set('logining', false).set('message', action.payload).set('isAuth', false);
        case AuthAction.LOG_OUT:
            return state.set('logouting', true).set('error', null);
        case AuthAction.LOG_OUT_FULFILLED:
            if(action.payload && action.payload.hasOwnProperty('isNotAuthButStayInSystem')){
                isNotAuthButStayInSystem = action.payload.isNotAuthButStayInSystem;
            }
            return state.set('logouting', false).set('authUser', action.payload).set('isAuth', isNotAuthButStayInSystem);
        case AuthAction.LOG_OUT_REJECTED:
            return state.set('logouting', false).set('error', action.payload).set('isAuth', true);
        case AuthAction.LOG_OUT_CANCELED:
            return state.set('logouting', false).set('message', action.payload).set('isAuth', true);
        case AuthAction.SESSION_EXPIRED_CANCELED:
            return state.set('logouting', false).set('authUser', action.payload).set('isAuth', false);
        case AuthAction.UPDATE_AUTH_USER_LANGUAGE:
            return state.set('updatingAuthUserLanguage', true).set('error', null);
        case AuthAction.UPDATE_AUTH_USER_LANGUAGE_FULFILLED:
            authUser = state.get('authUser');
            authUser.current_language = action.payload.currentLanguage;
            return state.set('updatingAuthUserLanguage', false).set('authUser', authUser);
        case AuthAction.UPDATE_AUTH_USER_LANGUAGE_REJECTED:
            return state.set('updatingAuthUserLanguage', false).set('error', fromJS(action.payload));
        case AuthAction.UPDATE_DASHBOARDSETTINGS:
            return state.set('updatingDashboardSettings', true).set('error', null);
        case AuthAction.UPDATE_DASHBOARDSETTINGS_FULFILLED:
            updateDashboardSettingsSubscriber(action.payload);
            return state.set('updatingDashboardSettings', false).set('authUser', action.payload);
        case AuthAction.UPDATE_DASHBOARDSETTINGS_REJECTED:
            return state.set('updatingDashboardSettings', false).set('error', action.payload);
        case AuthAction.UPDATE_THEME:
            return state.set('updatingTheme', true).set('error', null);
        case AuthAction.UPDATE_THEME_FULFILLED:
            return state.set('updatingTheme', false).set('authUser', action.payload);
        case AuthAction.UPDATE_THEME_REJECTED:
            return state.set('updatingTheme', false).set('error', fromJS(action.payload));
        case AuthAction.TOGGLE_APPTOUR:
            return state.set('togglingAppTour', true).set('error', null);
        case AuthAction.TOGGLE_APPTOUR_FULFILLED:
            authUser = state.get('authUser');
            authUser.userDetail = action.payload;
            return state.set('togglingAppTour', false).set('authUser', authUser);
        case AuthAction.TOGGLE_APPTOUR_REJECTED:
            return state.set('togglingAppTour', false).set('error', fromJS(action.payload));
        case AuthAction.CHECK_OCCONNECTION:
            return state.set('checkingOCConnection', API_REQUEST_STATE.START).set('error', null).set('checkOCConnectionResult', null);
        case AuthAction.CHECK_OCCONNECTION_FULFILLED:
            return state.set('checkingOCConnection', API_REQUEST_STATE.FINISH);
        case AuthAction.CHECK_OCCONNECTION_REJECTED:
            return state.set('checkingOCConnection', API_REQUEST_STATE.FINISH).set('error', fromJS(action.payload)).set('checkOCConnectionResult', fromJS(action.payload));
        default:
            return state;
    }
};


export {initialState, reducer as auth};