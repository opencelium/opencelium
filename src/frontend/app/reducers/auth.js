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

import {AuthAction} from '@utils/actions';
import {updateDashboardSettingsSubscriber} from "@utils/socket/users";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {getCryptLS, getLS, removeCryptLS, removeLS, setCryptLS, setLS} from "@utils/LocalStorage";
import {VIEW_TYPE} from "@components/general/list_of_components/List";

const notifications = getLS('notifications');
const initialState = fromJS({
    authUser: {},
    isAuth: false,
    expTime: 0,
    logining: API_REQUEST_STATE.INITIAL,
    logouting: false,
    updatingDashboardSettings: false,
    togglingAppTour: API_REQUEST_STATE.INITIAL,
    updatingTheme: false,
    updatingAuthUserLanguage: false,
    error: null,
    message: {},
    fromLogin: false,
    isSessionExpired: true,
    isNotificationPanelOpened: false,
    notifications: List(notifications ? notifications :[]),
});

let authUser = null;

/**
 * redux reducer for auth user
 */
const reducer = (state = initialState, action) => {
    let notifications = state.get('notifications');
    let index = -1;
    switch (action.type) {
        case AuthAction.INITIAL_STATE:
            return state;
        case AuthAction.LOG_IN:
            return state.set('logining', API_REQUEST_STATE.START).set('error', null).set('fromLogin', action.payload.fromLogin);
        case AuthAction.LOG_IN_FULFILLED:
            return state.set('logining', API_REQUEST_STATE.FINISH).set('authUser', action.payload).set('isAuth', true).set('isSessionExpired', false);
        case AuthAction.LOG_IN_REJECTED:
            return state.set('logining', API_REQUEST_STATE.ERROR).set('error', action.payload).set('isAuth', false);
        case AuthAction.LOG_IN_CANCELED:
            return state.set('logining', API_REQUEST_STATE.PAUSE).set('message', action.payload).set('isAuth', false);
        case AuthAction.LOG_OUT:
            return state.set('logouting', true).set('error', null);
        case AuthAction.LOG_OUT_FULFILLED:
            removeLS('notifications');
            removeLS('hasSubscriptionUpdate');
            removeLS('hasCheckedUpdate');
            removeLS('subscriptionUpdateFileNames');
            return state.set('logouting', false).set('authUser', action.payload).set('isAuth', false).set('notifications', List([]));
        case AuthAction.LOG_OUT_REJECTED:
            return state.set('logouting', false).set('error', action.payload).set('isAuth', true);
        case AuthAction.LOG_OUT_CANCELED:
            return state.set('logouting', false).set('message', action.payload).set('isAuth', true);
        case AuthAction.SESSION_EXPIRED_WARNED:
            if(!getCryptLS('token')){
                return state.set('isSessionExpired', true).set('logouting', false).set('authUser', action.payload).set('isAuth', false);
            }
            removeCryptLS('token');
            removeLS('notifications');
            removeLS('hasSubscriptionUpdate');
            removeLS('hasCheckedUpdate');
            removeLS('subscriptionUpdateFileNames');
            return state.set('isSessionExpired', true).set('notifications', List([]));
        case AuthAction.SESSION_NOTEXPIRED_FULFILLED:
            return state.set('isSessionExpired', false);
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
            return state.set('togglingAppTour', API_REQUEST_STATE.START).set('error', null);
        case AuthAction.TOGGLE_APPTOUR_FULFILLED:
            authUser = state.get('authUser');
            authUser.userDetail.appTour = !authUser.userDetail.appTour;
            setCryptLS("userDetail", authUser.userDetail);
            return state.set('togglingAppTour', API_REQUEST_STATE.FINISH).set('authUser', authUser);
        case AuthAction.TOGGLE_APPTOUR_REJECTED:
            return state.set('togglingAppTour', API_REQUEST_STATE.ERROR).set('error', fromJS(action.payload));
        case AuthAction.ADD_NOTIFICATION:
            notifications = notifications.unshift(action.payload);
            setLS('notifications', notifications.toJS());
            return state.set('notifications', notifications);
        case AuthAction.CLEAR_NOTIFICATION:
            index = notifications.findIndex(function (notification) {
                return notification.id === action.payload.id;
            });
            notifications = notifications.delete(index);
            setLS('notifications', notifications.toJS());
            return state.set('notifications', List(notifications));
        case AuthAction.CLEAR_ALL_NOTIFICATIONS:
            setLS('notifications', [])
            return state.set('notifications', List([]));
        case AuthAction.TOGGLE_NOTIFICATION_PANEL:
            return state.set('isNotificationPanelOpened', !state.get('isNotificationPanelOpened'));
        default:
            return state;
    }
};


export {initialState, reducer as auth};