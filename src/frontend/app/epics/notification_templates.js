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
import {NotificationTemplatesAction} from '../utils/actions';
import {
    fetchNotificationTemplatesFulfilled,fetchNotificationTemplatesRejected,
    fetchNotificationTemplateFulfilled, fetchNotificationTemplateRejected,
} from '../actions/notification_templates/fetch';
import {
    addNotificationTemplateFulfilled, addNotificationTemplateRejected,
} from '../actions/notification_templates/add';
import {
    updateNotificationTemplateFulfilled, updateNotificationTemplateRejected,
} from '../actions/notification_templates/update';
import {
    deleteNotificationTemplateFulfilled, deleteNotificationTemplateRejected,
} from '../actions/notification_templates/delete';

import {doRequest} from "../utils/auth";


/**
 * main url for notification templates
 */
const urlPrefix = 'notification_templates';


/**
 * fetch all notification templates
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchNotificationTemplatesEpic = (action$, store) => {
    return action$.ofType(NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATES)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: fetchNotificationTemplatesFulfilled,
                reject: fetchNotificationTemplatesRejected,
            });
        });
};

/**
 * fetch one notification template
 */
const fetchNotificationTemplateEpic = (action$, store) => {
    return action$.ofType(NotificationTemplatesAction.FETCH_NOTIFICATIONTEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.templateId}`;
            return doRequest({url},{
                success: fetchNotificationTemplateFulfilled,
                reject: fetchNotificationTemplateRejected,
            });
        });
};

/**
 * add one notification template
 */
const addNotificationTemplateEpic = (action$, store) => {
    return action$.ofType(NotificationTemplatesAction.ADD_NOTIFICATIONTEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return doRequest({url, method: 'post', data: action.payload},{
                success: addNotificationTemplateFulfilled,
                reject: addNotificationTemplateRejected,},
            );
        });
};
/**
 * update one notification template
 */
const updateNotificationTemplateEpic = (action$, store) => {
    return action$.ofType(NotificationTemplatesAction.UPDATE_NOTIFICATIONTEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return doRequest({url, method: 'post', data: action.payload},{
                success: updateNotificationTemplateFulfilled,
                reject: updateNotificationTemplateRejected,},
            );
        });
};

/**
 * delete one notification template by id
 */
const deleteNotificationTemplateEpic = (action$, store) => {
    return action$.ofType(NotificationTemplatesAction.DELETE_NOTIFICATIONTEMPLATE)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: 'delete'},{
                    success: deleteNotificationTemplateFulfilled,
                    reject: deleteNotificationTemplateRejected,},
                res => {return {...res.response, id: action.payload.id};}
            );
        });
};




export {
    fetchNotificationTemplatesEpic,
    fetchNotificationTemplateEpic,
    addNotificationTemplateEpic,
    updateNotificationTemplateEpic,
    deleteNotificationTemplateEpic,
};