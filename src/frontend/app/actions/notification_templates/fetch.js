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

import { NotificationTemplatesAction } from '@utils/actions';


/**
 * fetch Notification Template
 * @param notificationTemplate
 * @returns {{type: string, payload: {}}}
 */
const fetchNotificationTemplate = (notificationTemplate) => {
    return {
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE,
        payload: notificationTemplate,
    };
};

/**
 * fetch Notification Template fulfilled
 * @param notificationTemplate
 * @returns {{type: string, payload: {}}}
 */
const fetchNotificationTemplateFulfilled = (notificationTemplate) => {
    return {
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE_FULFILLED,
        payload: notificationTemplate,
    };
};

/**
 * fetch Notification Template rejected
 * @param error
 * @returns {promise}
 */
const fetchNotificationTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE_REJECTED,
        payload: error
    });
};

/**
 * fetch Notification Template canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchNotificationTemplateCanceled = (message) => {
    return {
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE_CANCELED,
        payload: message
    };
};

/**
 * fetch all Notification Templates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string}}
 */
const fetchNotificationTemplates = (settings = {}) => {
    return {
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES,
        settings,
    };
};

/**
 * fetch all Notification Templates fulfilled
 * @param notificationTemplates
 * @param settings = {background: bool}
 *      background - if true -> does not show a notification; else -> show a notification
 * @returns {{type: string, payload: []}}
 */
const fetchNotificationTemplatesFulfilled = (notificationTemplates, settings = {}) => {
    return{
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES_FULFILLED,
        payload: notificationTemplates,
        settings,
    };
};

/**
 * fetch all Notification Templates rejected
 * @param error
 * @returns {promise}
 */
const fetchNotificationTemplatesRejected = (error) => {
    return Rx.Observable.of({
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES_REJECTED,
        payload: error
    });
};

/**
 * fetch all Notification Templates canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchNotificationTemplatesCanceled = (message) => {
    return {
        type: NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES_CANCELED,
        payload: message
    };
};

export {
    fetchNotificationTemplates,
    fetchNotificationTemplatesFulfilled,
    fetchNotificationTemplatesRejected,
    fetchNotificationTemplatesCanceled,
    fetchNotificationTemplate,
    fetchNotificationTemplateFulfilled,
    fetchNotificationTemplateRejected,
    fetchNotificationTemplateCanceled,
};