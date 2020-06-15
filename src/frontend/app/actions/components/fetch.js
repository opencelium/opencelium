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

import Rx from 'rxjs/Rx';

import { ComponentsAction } from '@utils/actions';


/**
 * fetch all components
 * @returns {{type: string}}
 */
const fetchComponents = () => {
    return {
        type: ComponentsAction.FETCH_COMPONENTS
    };
};

/**
 * fetch all components fulfilled
 * @param components
 * @returns {{type: string, payload: []}}
 */
const fetchComponentsFulfilled = (components) => {
    return{
        type: ComponentsAction.FETCH_COMPONENTS_FULFILLED,
        payload: components
    };
};

/**
 * fetch all components rejected
 * @param error
 * @returns {promise}
 */
const fetchComponentsRejected = (error) => {
    return Rx.Observable.of({
        type: ComponentsAction.FETCH_COMPONENTS_REJECTED,
        payload: error
    });
};

/**
 * fetch all components canceled
 * @param message
 * @returns {{type: string, payload: []}}
 */
const fetchComponentsCanceled = (message) => {
    return{
        type: ComponentsAction.FETCH_COMPONENTS_CANCELED,
        payload: message
    };
};

export {
    fetchComponents,
    fetchComponentsFulfilled,
    fetchComponentsRejected,
    fetchComponentsCanceled,
};