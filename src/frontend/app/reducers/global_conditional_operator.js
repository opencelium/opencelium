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

import {fromJS, List} from 'immutable';

import {GlobalConditionalOperatorAction} from '@utils/actions';
import {API_REQUEST_STATE} from "@utils/constants/app";


const initialState = fromJS({
    fetchingConditionalOperator: API_REQUEST_STATE.INITIAL,
    updatingConditionalOperator: API_REQUEST_STATE.INITIAL,
    currentConditionalOperator: null,
    error: null,
    message: {},
    notificationData: {},
});

/**
 * redux reducer for global conditional operator
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case GlobalConditionalOperatorAction.UPDATE_CONDITIONALOPERATOR:
            return state.set('updatingConditionalOperator', API_REQUEST_STATE.START).set('error', null).set('currentWidget', action.payload.currentWidget);
        case GlobalConditionalOperatorAction.UPDATE_CONDITIONALOPERATOR_FULFILLED:
            return state.set('updatingConditionalOperator', API_REQUEST_STATE.FINISH);
        case GlobalConditionalOperatorAction.UPDATE_CONDITIONALOPERATOR_REJECTED:
            return state.set('updatingConditionalOperator', API_REQUEST_STATE.ERROR).set('error', action.payload).set('currentWidget', null);
        case GlobalConditionalOperatorAction.FETCH_CONDITIONALOPERATOR:
            return state.set('fetchingConditionalOperator', API_REQUEST_STATE.START).set('error', null);
        case GlobalConditionalOperatorAction.FETCH_CONDITIONALOPERATOR_FULFILLED:
            return state.set('fetchingConditionalOperator', API_REQUEST_STATE.FINISH).set('currentWidget', action.payload);
        case GlobalConditionalOperatorAction.FETCH_CONDITIONALOPERATOR_REJECTED:
            return state.set('fetchingConditionalOperator', API_REQUEST_STATE.ERROR).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as conditional_operator};