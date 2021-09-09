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

import { InvokersAction } from '@utils/actions';


/**
 * delete invoker
 * @param invoker
 * @returns {{type: string, payload: {}}}
 */
const deleteInvoker = (invoker) => {
    return {
        type: InvokersAction.DELETE_INVOKER,
        payload: invoker,
    };
};

/**
 * delete invoker fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteInvokerFulfilled = (status) => {
    return {
        type: InvokersAction.DELETE_INVOKER_FULFILLED,
        payload: status,
    };
};

/**
 * delete invoker rejected
 * @param error
 * @returns {*}
 */
const deleteInvokerRejected = (error) => {
    return Rx.Observable.of({
        type: InvokersAction.DELETE_INVOKER_REJECTED,
        payload: error
    });
};

/**
 * delete invokers
 * @param invokers
 * @returns {{type: string, payload: {}}}
 */
const deleteInvokers = (invokers) => {
    return {
        type: InvokersAction.DELETE_INVOKERS,
        payload: invokers,
    };
};

/**
 * delete invokers fulfilled
 * @param status
 * @returns {{type: string, payload: {}}}
 */
const deleteInvokersFulfilled = (status) => {
    return {
        type: InvokersAction.DELETE_INVOKERS_FULFILLED,
        payload: status,
    };
};

/**
 * delete invokers rejected
 * @param error
 * @returns {*}
 */
const deleteInvokersRejected = (error) => {
    return Rx.Observable.of({
        type: InvokersAction.DELETE_INVOKERS_REJECTED,
        payload: error
    });
};


export{
    deleteInvoker,
    deleteInvokerFulfilled,
    deleteInvokerRejected,
    deleteInvokers,
    deleteInvokersFulfilled,
    deleteInvokersRejected,
};