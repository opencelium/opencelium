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

import {AdminCardsAction} from '../utils/actions';
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    fetchingAdminCards: API_REQUEST_STATE.INITIAL,
    loadingAdminCardsLink: false,
    adminCard: null,
    adminCards: List([]),
    error: null,
    message: {},
    notificationData: {},
});

/**
 * redux reducer for Admin Cards
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case AdminCardsAction.FETCH_ADMINCARDS:
            return state.set('fetchingAdminCards', API_REQUEST_STATE.START).set('error', null);
        case AdminCardsAction.FETCH_ADMINCARDS_FULFILLED:
            if(!Array.isArray(action.payload)){
                return state.set('fetchingAdminCards', API_REQUEST_STATE.FINISH).set('adminCards', List([]));
            }
            return state.set('fetchingAdminCards', API_REQUEST_STATE.FINISH).set('adminCards', List(action.payload));
        case AdminCardsAction.FETCH_ADMINCARDS_REJECTED:
            return state.set('fetchingAdminCards', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case AdminCardsAction.LOAD_ADMINCARD:
            return state.set('loadingAdminCardsLink', true);
        case AdminCardsAction.LOAD_ADMINCARD_FULFILLED:
            return state.set('loadingAdminCardsLink', false);
        case AdminCardsAction.LOAD_ADMINCARD_REJECTED:
            return state.set('loadingAdminCardsLink', false);
        default:
            return state;
    }
};


export {initialState, reducer as admincards};