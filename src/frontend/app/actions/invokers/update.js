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
 * clean method of invoker
 * @returns {{type: string, payload: {}}}
 */
const cleanMethod = () => {
    return {
        type: InvokersAction.CLEAN_INVOKERMETHOD,
    }
}
/**
 * update method of invoker
 * @param data: {invokerName, methodData}
 * @returns {{type: string, payload: {}}}
 */
const updateMethod = (data) => {
    return {
        type: InvokersAction.UPDATE_INVOKERMETHOD,
        payload: data,
    }
}

/**
 * update method of invoker
 * @param methodData
 * @returns {{type: string, payload: {}}}
 */
const updateMethodFulfilled = (methodData) => {
    return {
        type: InvokersAction.UPDATE_INVOKERMETHOD_FULFILLED,
        payload: methodData,
    };
};

/**
 * update method of invoker
 * @param error
 * @returns {*}
 */
const updateMethodRejected = (error) => {
    return Rx.Observable.of({
        type: InvokersAction.UPDATE_INVOKERMETHOD_REJECTED,
        payload: error
    });
};

/**
 * create a new invoker
 * @param invoker
 * @returns {{type: string, payload: {}}}
 */
const updateInvoker = (invoker) => {
    return {
        type: InvokersAction.UPDATE_INVOKER,
        payload: invoker,
    };
};

/**
 * create a new invoker fulfilled
 * @param invoker
 * @returns {{type: string, payload: {}}}
 */
const updateInvokerFulfilled = (invoker) => {
    return {
        type: InvokersAction.UPDATE_INVOKER_FULFILLED,
        payload: invoker,
    };
};

/**
 * create a new invoker rejected
 * @param error
 * @returns {*}
 */
const updateInvokerRejected = (error) => {
    return Rx.Observable.of({
        type: InvokersAction.UPDATE_INVOKER_REJECTED,
        payload: error
    });
};



export{
    cleanMethod,
    updateMethod,
    updateMethodFulfilled,
    updateMethodRejected,
    updateInvoker,
    updateInvokerFulfilled,
    updateInvokerRejected,
};