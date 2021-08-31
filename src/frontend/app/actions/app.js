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

import Rx from 'rxjs/Rx';

import {AppAction} from '@utils/actions';


/**
 * change application language
 * @param language
 * @returns {{type: string, payload: {}}}
 */
const changeLanguage = (language) => {
    return {
        type: AppAction.CHANGE_LANGUAGE,
        payload: language
    };
};

/**
 * set component in ChangeContent as external or internal
 * @param isExternal
 * @returns {{type: string, payload: {}}}
 */
const setComponentInChangeContent = (isExternal = false) => {
    return {
        type: AppAction.SET_COMPONENTINCHANGECONTENT,
        payload: isExternal,
    }
}

/**
 * update burger menu
 * @param menu
 * @returns {{type: string, payload: {}}}
 */
const updateMenu = (menu) => {
    return {
        type: AppAction.UPDATE_MENU,
        payload: menu
    };
};

/**
 * execute each request to the server
 * @param error
 * @returns {promise}
 */
const doRequestRejected = (error) => {
    return Rx.Observable.of({
        type: AppAction.DO_REQUEST_REJECTED,
        payload: error
    });
};

/**
 * create a new error ticket
 * @param data
 * @returns {{type: string, payload: {}}}
 */
const addErrorTicket = (data) => {
    return {
        type: AppAction.ADD_ERRORTICKET,
        payload: data,
    };
};

/**
 * create a new error ticket fulfilled
 * @returns {{type: string, payload: {}}}
 */
const addErrorTicketFulfilled = () => {
    return {
        type: AppAction.ADD_ERRORTICKET_FULFILLED,
    };
};

/**
 * create a new error ticket rejected
 * @param error
 * @returns {promise}
 */
const addErrorTicketRejected = (error) => {
    return Rx.Observable.of({
        type: AppAction.ADD_ERRORTICKET_REJECTED,
        payload: error
    });
};

/**
 * fetch application version
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchAppVersion = (settings = {background: false}) => {
    return {
        type: AppAction.FETCH_APPVERSION,
        settings,
    };
};

/**
 * fetch application version fulfilled
 * @param app = application
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: {}}}
 */
const fetchAppVersionFulfilled = (app, settings = {background: false}) => {
    return {
        type: AppAction.FETCH_APPVERSION_FULFILLED,
        payload: app,
        settings: {...settings, hasCloseButton: true},
    };
};

/**
 * fetch application version rejected
 * @param error
 * @returns {promise}
 */
const fetchAppVersionRejected = (error) => {
    return Rx.Observable.of({
        type: AppAction.FETCH_APPVERSION_REJECTED,
        payload: error
    });
};

/**
 * set current page items
 * @returns {{type: string, payload: {}}}
 */
const setCurrentPageItems = (data) => {
    return {
        type: AppAction.SET_CURRENT_PAGE_ITEMS,
        payload: data,
    };
};

/**
 * set form section in full screen or not
 * @returns {{type: string, payload: {}}}
 */
const setFullScreenFormSection = (isFullScreen) => {
    return {
        type: AppAction.SET_FORM_SECTION_FULL_SCREEN,
        payload: isFullScreen,
    };
};

/**
 * set connection draft to open only once
 * @returns {{type: string, payload: {}}}
 */
const setConnectionDraftWasOpened = (isOpenedOnce) => {
    return {
        type: AppAction.SET_CONNECTION_DRAFT_TO_OPEN_ONCE,
        payload: isOpenedOnce,
    };
};


/**
 * toggle notification panel
 * @returns {{type: string, payload: {}}}
 */
const toggleNotificationPanel = () => {
    return {
        type: AppAction.TOGGLE_NOTIFICATION_PANEL,
    };
};


export {
    changeLanguage,
    setComponentInChangeContent,
    updateMenu,
    doRequestRejected,
    addErrorTicket,
    addErrorTicketFulfilled,
    addErrorTicketRejected,
    fetchAppVersion,
    fetchAppVersionFulfilled,
    fetchAppVersionRejected,
    setCurrentPageItems,
    setFullScreenFormSection,
    setConnectionDraftWasOpened,
    toggleNotificationPanel,
};