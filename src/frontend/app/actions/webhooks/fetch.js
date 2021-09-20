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

import { WebHooksAction } from '@utils/actions';


/**
 * fetch webHook by connectionId and userId
 * @returns {{type: string, payload: {}}}
 */
const fetchWebHook = (data) => {
    return {
        type: WebHooksAction.FETCH_WEBHOOK,
        payload: data,
    };
};
/**
 * fetch webHook fulfilled
 * @param webHook
 * @returns {{type: string, payload: {}}}
 */
const fetchWebHookFulfilled = (webHook) => {
    return {
        type: WebHooksAction.FETCH_WEBHOOK_FULFILLED,
        payload: webHook,
    };
};

/**
 * fetch webHook rejected
 * @param error
 * @returns {promise}
 */
const fetchWebHookRejected = (error) => {
    return Rx.Observable.of({
        type: WebHooksAction.FETCH_WEBHOOK_REJECTED,
        payload: error
    });
};

/**
 * copy to clipboard the webhook
 * @param schedule
 * @returns {{type: string, payload: {}}}
 */
const copyToClipboardWebHookFulfilled = (schedule) => {
    return {
        type: WebHooksAction.COPYTOCLIPBOARD_WEBHOOK_FULFILLED,
        payload: schedule,
    };
};


export {
    fetchWebHook,
    fetchWebHookFulfilled,
    fetchWebHookRejected,
    copyToClipboardWebHookFulfilled,
};