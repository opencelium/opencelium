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

import {List, fromJS} from 'immutable';

import {ComponentsAction} from '../utils/actions';
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    fetchingComponents: API_REQUEST_STATE.INITIAL,
    components: List([]),
    error: null,
    message: {},
    notificationData: {},
});

/**
 * redux reducer for components
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case ComponentsAction.FETCH_COMPONENTS:
            return state.set('fetchingComponents', API_REQUEST_STATE.START).set('error', null);
        case ComponentsAction.FETCH_COMPONENTS_FULFILLED:
            return state.set('fetchingComponents', API_REQUEST_STATE.FINISH).set('components', List(action.payload));
        case ComponentsAction.FETCH_COMPONENTS_REJECTED:
            return state.set('fetchingComponents', API_REQUEST_STATE.ERROR).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as components};