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

import { InvokersAction } from '../../utils/actions';


/**
 * fetch all invokers
 * @returns {{type: string}}
 */
const fetchInvokers = () => {
    return {
        type: InvokersAction.FETCH_INVOKERS
    };
};

/**
 * fetch all invokers fulfilled
 * @param invokers
 * @returns {{type: string, payload: {}}}
 */
const fetchInvokersFulfilled = (invokers) => {
    return{
        type: InvokersAction.FETCH_INVOKERS_FULFILLED,
        payload: invokers
    };
};

/**
 * fetch all invokers rejected
 * @param error
 * @returns {*}
 */
const fetchInvokersRejected = (error) => {
    return Rx.Observable.of({
        type: InvokersAction.FETCH_INVOKERS_REJECTED,
        payload: error
    });
};

/**
 * fetch all invokers canceled
 * @param message
 * @returns {{type: string, payload: {}}}
 */
const fetchInvokersCanceled = (message) => {
    return{
        type: InvokersAction.FETCH_INVOKERS_CANCELED,
        payload: message
    };
};


export {
    fetchInvokers,
    fetchInvokersFulfilled,
    fetchInvokersRejected,
    fetchInvokersCanceled,
};