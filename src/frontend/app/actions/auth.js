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

import { AuthAction } from '../utils/actions';
import {removeAllLS, setLS} from '../utils/LocalStorage';


/**
 * update theme
 * @param user
 */
const toggleAppTour = (user) => {
    return {
        type: AuthAction.TOGGLE_APPTOUR,
        payload: user,
    };
};

/**
 * update theme fulfilled
 * @param user
 * @returns {{type: string, payload: {}, data: {}}}
 */
const toggleAppTourFulfilled = (userDetail) => {
    setLS("userDetail", userDetail);
    return {
        type: AuthAction.TOGGLE_APPTOUR_FULFILLED,
        payload: userDetail,
    };
};

/**
 * update theme rejected
 * @param error
 * @returns {promise}
 */
const toggleAppTourRejected = (error) => {
    return Rx.Observable.of({
        type: AuthAction.TOGGLE_APPTOUR_REJECTED,
        payload: error
    });
};
/**
 * update language of the auth user
 * @param language
 * @returns {{type: string, payload: {}}}
 */
const updateAuthUserLanguage = (language) => {
    return {
        type: AuthAction.UPDATE_AUTH_USER_LANGUAGE,
        payload: language
    };
};

/**
 * update language of the auth user fulfilled
 * @param language
 * @returns {{type: string, payload: {}}}
 */
const updateAuthUserLanguageFulfilled = (language) => {
    return {
        type: AuthAction.UPDATE_AUTH_USER_LANGUAGE_FULFILLED,
        payload: language
    };
};

/**
 * update language of the auth user rejected
 * @param error
 * @returns {promise}
 */
const updateAuthUserLanguageRejected = (error) => {
    return Rx.Observable.of({
        type: AuthAction.UPDATE_AUTH_USER_LANGUAGE_REJECTED,
        payload: error
    });
};

/**
 * login user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const loginUser = (user) => {
    return {
        type: AuthAction.LOG_IN,
        payload: user,
    };
};

/**
 * login user fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const loginUserFulfilled = (user) => {
    return{
        type: AuthAction.LOG_IN_FULFILLED,
        payload: user,
    };
};

/**
 * login user rejected
 * @param error
 * @returns {{type: string, payload: {}}}
 */
const loginUserRejected = (error) => {
    return Rx.Observable.of({
        type: AuthAction.LOG_IN_REJECTED,
        payload: error
    });
};

/**
 * logout user
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const logoutUser = (user) => {
    return {
        type: AuthAction.LOG_OUT,
        payload: user,
    };
};

/**
 * logout user fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const logoutUserFulfilled = (user) => {
    removeAllLS();
    return {
        type: AuthAction.LOG_OUT_FULFILLED,
        payload: user,
    };
};

/**
 * session of the user was expired
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const sessionExpired = (user) => {
    removeAllLS();
    return {
        type: AuthAction.SESSION_EXPIRED_CANCELED,
        payload: user,
    };
};

/**
 * logout user rejected
 * @param error
 * @returns {promise}
 */
const logoutUserRejected = (error) => {
    return Rx.Observable.of({
        type: AuthAction.LOG_OUT_REJECTED,
        payload: error
    });
};

/**
 * logout user canceled
 * @param message
 * @returns {promise}
 */
const logoutUserCanceled = (message) => {
    return Rx.Observable.of({
        type: AuthAction.LOG_OUT_CANCELED,
        payload: message
    });
};

/**
 * update dashboard settings
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateDashboardSettings = (user) => {
    return {
        type: AuthAction.UPDATE_DASHBOARDSETTINGS,
        payload: user,
    };
};

/**
 * update dashboard settings fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateDashboardSettingsFulfilled = (user) => {
    return Rx.Observable.of({
        type: AuthAction.UPDATE_DASHBOARDSETTINGS_FULFILLED,
        payload: user,
    });
};

/**
 * update dashboard settings rejected
 * @param error
 * @returns {promise}
 */
const updateDashboardSettingsRejected = (error) => {
    return Rx.Observable.of({
        type: AuthAction.UPDATE_DASHBOARDSETTINGS_REJECTED,
        payload: error
    });
};

/**
 * update theme
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateTheme = (data) => {
    return {
        type: AuthAction.UPDATE_THEME,
        payload: data,
    };
};

/**
 * update theme fulfilled
 * @param user
 * @returns {{type: string, payload: {}}}
 */
const updateThemeFulfilled = (user) => {
    setLS("userDetail", user.userDetail);
    return {
        type: AuthAction.UPDATE_THEME_FULFILLED,
        payload: user,
    };
};

/**
 * update theme rejected
 * @param error
 * @returns {promise}
 */
const updateThemeRejected = (error) => {
    return Rx.Observable.of({
        type: AuthAction.UPDATE_THEME_REJECTED,
        payload: error
    });
};

export {
    loginUser,
    loginUserFulfilled,
    loginUserRejected,
    logoutUserFulfilled,
    updateAuthUserLanguage,
    updateAuthUserLanguageFulfilled,
    updateAuthUserLanguageRejected,
    sessionExpired,
    updateTheme,
    updateThemeFulfilled,
    updateThemeRejected,
    updateDashboardSettings,
    updateDashboardSettingsFulfilled,
    updateDashboardSettingsRejected,
    toggleAppTour,
    toggleAppTourFulfilled,
    toggleAppTourRejected,
};