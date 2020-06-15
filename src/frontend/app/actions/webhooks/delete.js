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

import { WebHooksAction } from '@utils/actions';


/**
 * delete webHook
 * @param data - {id, connectionId}
 * @returns {{type: string, payload: *}}
 */
const deleteWebHook = (data) => {
    return {
        type: WebHooksAction.DELETE_WEBHOOK,
        payload: data,
    };
};

/**
 * delete webHook fulfilled
 * @param webHook
 * @returns {{type: string, payload: {}}}
 */
const deleteWebHookFulfilled = (webHook) => {
    return {
        type: WebHooksAction.DELETE_WEBHOOK_FULFILLED,
        payload: webHook,
    };
};

/**
 * delete webHook rejected
 * @param error
 * @returns {promise}
 */
const deleteWebHookRejected = (error) => {
    return Rx.Observable.of({
        type: WebHooksAction.DELETE_WEBHOOK_REJECTED,
        payload: error
    });
};


export{
    deleteWebHook,
    deleteWebHookFulfilled,
    deleteWebHookRejected,
};