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
 * create a new invoker
 * @param invoker
 * @returns {{type: string, payload: {}}}
 */
const addInvoker = (invoker) => {
    return {
        type: InvokersAction.ADD_INVOKER,
        payload: invoker,
    };
};

/**
 * create a new invoker fulfilled
 * @param invoker
 * @returns {{type: string, payload: {}}}
 */
const addInvokerFulfilled = (invoker) => {
    return {
        type: InvokersAction.ADD_INVOKER_FULFILLED,
        payload: invoker,
    };
};

/**
 * create a new invoker rejected
 * @param error
 * @returns {*}
 */
const addInvokerRejected = (error) => {
    return Rx.Observable.of({
        type: InvokersAction.ADD_INVOKER_REJECTED,
        payload: error
    });
};



export{
    addInvoker,
    addInvokerFulfilled,
    addInvokerRejected,
};