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

import {fromJS} from 'immutable';

import {SubscriptionUpdate} from '@utils/actions';
import {API_REQUEST_STATE} from "@utils/constants/app";


const initialState = fromJS({
    fetchingSubscriptionUpdate: API_REQUEST_STATE.INITIAL,
    hasUpdate: false,
    error: null,
    message: {},
});

/**
 * redux reducer for subscription update
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE:
            return state.set('fetchingSubscriptionUpdate', API_REQUEST_STATE.START).set('error', null);
        case SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE_FULFILLED:
            return state.set('fetchingSubscriptionUpdate', API_REQUEST_STATE.FINISH).set('hasUpdate', action.payload.version);
        case SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE_REJECTED:
            return state.set('fetchingSubscriptionUpdate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as subscription_update};