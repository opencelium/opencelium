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

import {NotificationTemplatesAction} from '@utils/actions';


/**
 * create a new Notification Template
 * @param notificationTemplate
 * @returns {{type: string, payload: {}}}
 */
const addNotificationTemplate = (notificationTemplate) => {
    return {
        type: NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE,
        payload: notificationTemplate,
    };
};

/**
 * create a new Notification Template fulfilled
 * @param notificationTemplate
 * @returns {{type: string, payload: {}}}
 */
const addNotificationTemplateFulfilled = (notificationTemplate) => {
    return {
        type: NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE_FULFILLED,
        payload: notificationTemplate,
    };
};

/**
 * create a new Notification Template rejected
 * @param error
 * @returns {*}
 */
const addNotificationTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE_REJECTED,
        payload: error
    });
};



export{
    addNotificationTemplate,
    addNotificationTemplateFulfilled,
    addNotificationTemplateRejected,
};