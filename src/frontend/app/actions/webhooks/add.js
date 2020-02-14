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

import { WebHooksAction } from '../../utils/actions';


/**
 * add a web hook
 * @param data - {userId, connectionId}
 * @returns {{type: string, payload: {}}}
 */
const addWebHook = (data) => {
    return {
        type: WebHooksAction.ADD_WEBHOOK,
        payload: data,
    };
};

/**
 * add a webhook fulfilled
 * @param webHook
 * @returns {{type: string, payload: {}}}
 */
const addWebHookFulfilled = (webHook) => {
    return {
        type: WebHooksAction.ADD_WEBHOOK_FULFILLED,
        payload: webHook,
    };
};

/**
 * add a webhook rejected
 * @param error
 * @returns {promise}
 */
const addWebHookRejected = (error) => {
    return Rx.Observable.of({
        type: WebHooksAction.ADD_WEBHOOK_REJECTED,
        payload: error
    });
};


export{
    addWebHook,
    addWebHookFulfilled,
    addWebHookRejected,
};