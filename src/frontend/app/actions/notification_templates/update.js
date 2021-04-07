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

import {NotificationTemplatesAction} from '@utils/actions';


/**
 * update Notification Template
 * @param notificationTemplate
 * @returns {{type: string, payload: {}}}
 */
const updateNotificationTemplate = (notificationTemplate) => {
    return {
        type: NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE,
        payload: notificationTemplate,
    };
};

/**
 * update Notification Template fulfilled
 * @param notificationTemplate
 * @returns {{type: string, payload: {}}}
 */
const updateNotificationTemplateFulfilled = (notificationTemplate) => {
    return {
        type: NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE_FULFILLED,
        payload: notificationTemplate,
    };
};

/**
 * update Notification Template rejected
 * @param error
 * @returns {promise}
 */
const updateNotificationTemplateRejected = (error) => {
    return Rx.Observable.of({
        type: NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE_REJECTED,
        payload: error
    });
};


export{
    updateNotificationTemplate,
    updateNotificationTemplateFulfilled,
    updateNotificationTemplateRejected,
};