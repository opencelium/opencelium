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

import {WebHooksAction} from '@utils/actions';

import {
    addWebHookFulfilled, addWebHookRejected,
} from '@actions/webhooks/add';
import {
    updateWebHookFulfilled, updateWebHookRejected,
} from '@actions/webhooks/update';
import {
    deleteWebHookFulfilled, deleteWebHookRejected,
} from '@actions/webhooks/delete';
import {doRequest} from "@utils/auth";

import {
    validateAddWebHook, validateUpdateWebHook, validateDeleteWebHook,
} from "@validations/webhooks";
import {API_METHOD} from "@utils/constants/app";


/**
 * main url for webhooks
 */
const urlPrefix = 'webhook';

/**
 * add one webhook
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const addWebHookEpic = (action$, store) => {
    return action$.ofType(WebHooksAction.ADD_WEBHOOK)
        .debounceTime(100)
        .mergeMap((action) => {
            let validation = validateAddWebHook(action.payload);
            if(validation.success) {
                const {userId, schedule} = action.payload;
                const {id, title} = schedule;
                let url = `${urlPrefix}/url/${userId}/${id}`;
                return doRequest({url}, {
                        success: addWebHookFulfilled,
                        reject: addWebHookRejected,},
                    res => {return {webhook: res.response, id, schedule: {title}};}
                );
            } else{
                return addWebHookRejected({'message': validation.message});
            }
        });
};

/**
 * update one webhook
 */
const updateWebHookEpic = (action$, store) => {
    return action$.ofType(WebHooksAction.UPDATE_WEBHOOK)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = action.payload;
            let validation = validateUpdateWebHook(action.payload);
            if(validation.success) {
                return doRequest({url, isApi: false, method: API_METHOD.PUT, data}, {
                        success: updateWebHookFulfilled,
                        reject: updateWebHookRejected,
                    },
                );
            } else{
                return updateWebHookRejected({'message': validation.message});
            }
        });
};

/**
 * delete one webhook by id
 */
const deleteWebHookEpic = (action$, store) => {
    return action$.ofType(WebHooksAction.DELETE_WEBHOOK)
        .debounceTime(100)
        .mergeMap((action) => {
            let validation = validateDeleteWebHook(action.payload);
            if(validation.success) {
                let {id, schedule} = action.payload;
                let url = `${urlPrefix}/${id}`;
                return doRequest({url, method: API_METHOD.DELETE}, {
                        success: deleteWebHookFulfilled,
                        reject: deleteWebHookRejected,},
                    res => {return {schedulerId: schedule.id, schedule};}
                );
            } else{
                return deleteWebHookRejected({'message': validation.message});
            }
        });
};


export {
    addWebHookEpic,
    updateWebHookEpic,
    deleteWebHookEpic,
};