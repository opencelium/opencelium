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

import Rx from 'rxjs/Rx';

import { AppsAction } from '@utils/actions';


/**
 * fetch all apps
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, settings: {}}}
 */
const fetchApps = (settings = {}) => {
    return {
        type: AppsAction.FETCH_APPS,
        settings,
    };
};

/**
 * fetch all apps fulfilled
 * @param apps
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: [], settings: {}}}
 */
const fetchAppsFulfilled = (apps, settings = {}) => {
    return {
        type: AppsAction.FETCH_APPS_FULFILLED,
        payload: apps,
        settings,
    };
};

/**
 * fetch all apps rejected
 * @param error
 * @returns {promise}
 */
const fetchAppsRejected = (error) => {
    return Rx.Observable.of({
        type: AppsAction.FETCH_APPS_REJECTED,
        payload: error
    });
};

/**
 * fetch all apps canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchAppsCanceled = (message) => {
    return {
        type: AppsAction.FETCH_APPS_CANCELED,
        payload: message,
    };
};

/**
 * check app
 * @param app
 * @returns {{type: string, payload: {}}}
 */
const checkApp = (app) => {
    return {
        type: AppsAction.CHECK_APP,
        payload: app,
    };
};

/**
 * check app fulfilled
 * @param result
 * @returns {{type: string, payload: {}}}
 */
const checkAppFulfilled = (result) => {
    return {
        type: AppsAction.CHECK_APP_FULFILLED,
        payload: result,
    };
};

/**
 * check app rejected
 * @param error
 * @returns {promise}
 */
const checkAppRejected = (error) => {
    return {
        type: AppsAction.CHECK_APP_REJECTED,
        payload: error
    };
};

/**
 * check app canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const checkAppCanceled = (message) => {
    return {
        type: AppsAction.CHECK_APP_CANCELED,
        payload: message,
    };
};

export {
    fetchApps,
    fetchAppsFulfilled,
    fetchAppsRejected,
    fetchAppsCanceled,
    checkApp,
    checkAppFulfilled,
    checkAppRejected,
    checkAppCanceled,
};