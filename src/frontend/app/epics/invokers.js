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

import {InvokersAction} from '../utils/actions';
import {
    fetchInvokersFulfilled,fetchInvokersRejected,
} from '../actions/invokers/fetch';
import {
    addInvokerFulfilled, addInvokerRejected,
} from '../actions/invokers/add';
import {
    updateInvokerFulfilled, updateInvokerRejected,
} from '../actions/invokers/update';
import {
    deleteInvokerFulfilled, deleteInvokerRejected,
} from '../actions/invokers/delete';

import {doRequest} from "../utils/auth";


/**
 * main url for invokers
 */
const urlPrefix = 'invoker';


/**
 * fetch all invokers
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchInvokersEpic = (action$, store) => {
    return action$.ofType(InvokersAction.FETCH_INVOKERS)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: fetchInvokersFulfilled,
                reject: fetchInvokersRejected,
            });
        });
};
/**
 * add one connector
 */
const addInvokerEpic = (action$, store) => {
    return action$.ofType(InvokersAction.ADD_INVOKER)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return doRequest({url, method: 'post', data: action.payload},{
                success: addInvokerFulfilled,
                reject: addInvokerRejected,},
            );
        });
};
/**
 * add one connector
 */
const updateInvokerEpic = (action$, store) => {
    return action$.ofType(InvokersAction.UPDATE_INVOKER)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return doRequest({url, method: 'put', data: action.payload},{
                success: updateInvokerFulfilled,
                reject: updateInvokerRejected,},
            );
        });
};

/**
 * delete one invoker by id
 */
const deleteInvokerEpic = (action$, store) => {
    return action$.ofType(InvokersAction.DELETE_INVOKER)
        .debounceTime(500)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: 'delete'},{
                    success: deleteInvokerFulfilled,
                    reject: deleteInvokerRejected,},
                res => {return {...res.response, id: action.payload.id};}
            );
        });
};




export {
    fetchInvokersEpic,
    addInvokerEpic,
    updateInvokerEpic,
    deleteInvokerEpic,
};