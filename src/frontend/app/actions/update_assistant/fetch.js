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

import {UpdateAssistantAction} from '@utils/actions';


/**
 * fetch update application version
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchUpdateAppVersion = (settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.FETCH_UPDATEAPPVERSION,
        settings,
    };
};

/**
 * fetch update application version fulfilled
 * @param app = application
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchUpdateAppVersionFulfilled = (app, settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.FETCH_UPDATEAPPVERSION_FULFILLED,
        payload: app,
        settings: {...settings, hasCloseButton: true},
    };
};

/**
 * fetch update application version rejected
 * @param error
 * @returns {promise}
 */
const fetchUpdateAppVersionRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.FETCH_UPDATEAPPVERSION_REJECTED,
        payload: error
    });
};

/**
 * fetch online updates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchOnlineUpdates = (settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.FETCH_ONLINEUPDATES,
        settings,
    };
};

/**
 * fetch online updates fulfilled
 * @param updates = available updates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchOnlineUpdatesFulfilled = (updates, settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.FETCH_ONLINEUPDATES_FULFILLED,
        payload: updates,
        settings: {...settings, hasCloseButton: true},
    };
};

/**
 * fetch online updates rejected
 * @param error
 * @returns {promise}
 */
const fetchOnlineUpdatesRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.FETCH_ONLINEUPDATES_REJECTED,
        payload: error
    });
};
/**
 * fetch offline updates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchOfflineUpdates = (settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.FETCH_ONLINEUPDATES,
        settings,
    };
};

/**
 * fetch offline updates fulfilled
 * @param updates = available updates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchOfflineUpdatesFulfilled = (updates, settings = {background: false}) => {
    return {
        type: UpdateAssistantAction.FETCH_ONLINEUPDATES_FULFILLED,
        payload: updates,
        settings: {...settings, hasCloseButton: true},
    };
};

/**
 * fetch offline updates rejected
 * @param error
 * @returns {promise}
 */
const fetchOfflineUpdatesRejected = (error) => {
    return Rx.Observable.of({
        type: UpdateAssistantAction.FETCH_ONLINEUPDATES_REJECTED,
        payload: error
    });
};

export {
    fetchUpdateAppVersion,
    fetchUpdateAppVersionRejected,
    fetchUpdateAppVersionFulfilled,
    fetchOnlineUpdates,
    fetchOnlineUpdatesRejected,
    fetchOnlineUpdatesFulfilled,
    fetchOfflineUpdates,
    fetchOfflineUpdatesRejected,
    fetchOfflineUpdatesFulfilled,
};