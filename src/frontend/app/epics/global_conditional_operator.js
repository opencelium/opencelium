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

import {GlobalConditionalOperatorAction} from "@utils/actions";
import {doRequest} from "@utils/auth";
import {
    fetchConditionalOperatorFulfilled, fetchConditionalOperatorRejected,
} from "@actions/global_conditional_operators/fetch";
import {updateConditionalOperatorFulfilled, updateConditionalOperatorRejected} from "@actions/global_conditional_operators/update";
import {API_METHOD} from "@utils/constants/app";


/**
 * fetch conditional operator
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchConditionalOperatorEpic = (action$, store) => {
    return action$.ofType(GlobalConditionalOperatorAction.FETCH_CONDITIONALOPERATOR)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `global_parameters`;
            return doRequest({url},{
                success: fetchConditionalOperatorFulfilled,
                reject: fetchConditionalOperatorRejected,
            });
        });
};

/**
 * update conditional operator
 */
const updateConditionalOperatorEpic = (action$, store) => {
    return action$.ofType(GlobalConditionalOperatorAction.UPDATE_CONDITIONALOPERATOR)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `global_parameters`;
            return doRequest({url, method: API_METHOD.POST, data: {...action.payload}},{
                success: updateConditionalOperatorFulfilled,
                reject: updateConditionalOperatorRejected,},
            );
        });
};

export {
    fetchConditionalOperatorEpic,
    updateConditionalOperatorEpic,
};