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

import {List, fromJS} from 'immutable';

import {InvokersAction} from '../utils/actions';
import {API_REQUEST_STATE} from "../utils/constants/app";
import {isArray} from "../utils/app";


const initialState = fromJS({
    fetchingInvokers: API_REQUEST_STATE.INITIAL,
    addingInvoker: API_REQUEST_STATE.INITIAL,
    updatingInvoker: API_REQUEST_STATE.INITIAL,
    deletingInvoker: API_REQUEST_STATE.INITIAL,
    invokers: List([]),
    error: null,
    message: {},
    notificationData: {},
});

let invokers = [];
let invoker = {};
let index = 0;
/**
 * redux reducer for invokers
 */
const reducer = (state = initialState, action) => {
    invokers = state.get('invokers');
    switch (action.type) {
        case InvokersAction.FETCH_INVOKERS:
            return state.set('fetchingInvokers', API_REQUEST_STATE.START).set('error', null);
        case InvokersAction.FETCH_INVOKERS_FULFILLED:
            if(isArray(action.payload)){
                invokers = List(action.payload);
            } else{
                invokers = List([]);
            }
            return state.set('fetchingInvokers', API_REQUEST_STATE.FINISH).set('invokers', invokers);
        case InvokersAction.FETCH_INVOKERS_REJECTED:
            return state.set('fetchingInvokers', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case InvokersAction.ADD_INVOKER:
            return state.set('addingInvoker', API_REQUEST_STATE.START).set('error', null);
        case InvokersAction.ADD_INVOKER_FULFILLED:
            return state.set('addingInvoker', API_REQUEST_STATE.FINISH).set('invokers', invokers.set(invokers.size, action.payload));
        case InvokersAction.ADD_INVOKER_REJECTED:
            return state.set('addingInvoker', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case InvokersAction.UPDATE_INVOKER:
            return state.set('updatingInvoker', API_REQUEST_STATE.START).set('error', null);
        case InvokersAction.UPDATE_INVOKER_FULFILLED:
            index = invokers.findIndex(function (invoker) {
                return invoker.id === action.payload.id;
            });
            if(index >= 0) {
                invoker = action.payload;
                return state.set('updatingInvoker', API_REQUEST_STATE.FINISH).set('invokers', invokers.set(index, invoker));
            }
            return state.set('updatingInvoker', API_REQUEST_STATE.FINISH);
        case InvokersAction.UPDATE_INVOKER_REJECTED:
            return state.set('updatingInvoker', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case InvokersAction.DELETE_INVOKER:
            return state.set('deletingInvoker', API_REQUEST_STATE.START).set('error', null);
        case InvokersAction.DELETE_INVOKER_FULFILLED:
            index = invokers.findIndex(function (invoker) {
                return invoker.id === action.payload.id;
            });
            if(index >= 0) {
                return state.set('deletingInvoker', API_REQUEST_STATE.FINISH).set('invokers', invokers.delete(index));
            }
            return state.set('deletingInvoker', API_REQUEST_STATE.FINISH);
        case InvokersAction.DELETE_INVOKER_REJECTED:
            return state.set('deletingInvoker', API_REQUEST_STATE.ERROR).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as invokers};