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
import Rx from 'rxjs';
import {InvokersAction} from '@utils/actions';
import {
    fetchInvokersFulfilled,fetchInvokersRejected,
    fetchInvokerFulfilled, fetchInvokerRejected,
    fetchDefaultInvokersFulfilled,
} from '@actions/invokers/fetch';
import {
    addInvokerFulfilled, addInvokerRejected,
} from '@actions/invokers/add';
import {
    updateInvokerFulfilled, updateInvokerRejected, updateMethodFulfilled, updateMethodRejected,
} from '@actions/invokers/update';
import {
    deleteInvokerFulfilled, deleteInvokerRejected,
    deleteInvokersFulfilled, deleteInvokersRejected,
} from '@actions/invokers/delete';

import {doRequest} from "@utils/auth";
import {API_METHOD} from "@utils/constants/app";


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
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            return doRequest({url},{
                success: fetchInvokersFulfilled,
                reject: fetchInvokersRejected,
            });
        });
};

/**
 * fetch default invokers
 *
 * @param action$ - catch the state of the app
 * @param store - from redux
 * returns promise depending on the result of request
 */
const fetchDefaultInvokersEpic = (action$, store) => {
    return action$.ofType(InvokersAction.FETCH_DEFAULTINVOKERS)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/all`;
            /*
            * TODO: change when backend will be ready
            */
            return Rx.Observable.of(fetchDefaultInvokersFulfilled([{name: 'icinga2'}, {name: 'trello'}, {name: 'sensu'}]));
            /*return doRequest({url},{
                success: fetchDefaultInvokersFulfilled,
                reject: fetchDefaultInvokersRejected,
            });*/
        });
};
/**
 * fetch one connector
 */
const fetchInvokerEpic = (action$, store) => {
    return action$.ofType(InvokersAction.FETCH_INVOKER)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url},{
                success: fetchInvokerFulfilled,
                reject: fetchInvokerRejected,
            });
        });
};

/**
 * add one invoker
 */
const addInvokerEpic = (action$, store) => {
    return action$.ofType(InvokersAction.ADD_INVOKER)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: addInvokerFulfilled,
                reject: addInvokerRejected,},
            );
        });
};

/**
 * update one invoker
 */
const updateInvokerEpic = (action$, store) => {
    return action$.ofType(InvokersAction.UPDATE_INVOKER)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            return doRequest({url, method: API_METHOD.POST, data: action.payload},{
                success: updateInvokerFulfilled,
                reject: updateInvokerRejected,},
            );
        });
};

/**
 * update invoker method
 */
const updateInvokerMethodEpic = (action$, store) => {
    return action$.ofType(InvokersAction.UPDATE_INVOKERMETHOD)
        .debounceTime(100)
        .mergeMap((action) => {
            const {invokerName, methodData} = action.payload;
            let url = `${urlPrefix}/${invokerName}/xml`;
            return doRequest({url, method: API_METHOD.POST, data: methodData},{
                success: updateMethodFulfilled,
                reject: updateMethodRejected,},
            );
        });
};

/**
 * delete one invoker by id
 */
const deleteInvokerEpic = (action$, store) => {
    return action$.ofType(InvokersAction.DELETE_INVOKER)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}/${action.payload.id}`;
            return doRequest({url, method: API_METHOD.DELETE},{
                    success: deleteInvokerFulfilled,
                    reject: deleteInvokerRejected,},
                res => {return {...res.response, id: action.payload.id};}
            );
        });
};

/**
 * delete invokers by ids
 */
const deleteInvokersEpic = (action$, store) => {
    return action$.ofType(InvokersAction.DELETE_INVOKERS)
        .debounceTime(100)
        .mergeMap((action) => {
            let url = `${urlPrefix}`;
            let data = action.payload;
            return doRequest({url, method: API_METHOD.DELETE, data},{
                    success: deleteInvokersFulfilled,
                    reject: deleteInvokersRejected,},
                res => {return {ids: action.payload};}
            );
        });
};



export {
    fetchInvokersEpic,
    fetchInvokerEpic,
    addInvokerEpic,
    updateInvokerEpic,
    updateInvokerMethodEpic,
    deleteInvokerEpic,
    deleteInvokersEpic,
    fetchDefaultInvokersEpic
};