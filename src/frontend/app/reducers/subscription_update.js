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

import {SubscriptionUpdate} from '@utils/actions';
import {API_REQUEST_STATE} from "@utils/constants/app";
import {getLS, setLS} from "@utils/LocalStorage";


const initialState = fromJS({
    fetchingSubscriptionUpdate: API_REQUEST_STATE.INITIAL,
    doingSubscriptionUpdate: API_REQUEST_STATE.INITIAL,
    hasUpdate: getLS('hasSubscriptionUpdate') || false,
    error: null,
    fileNames: List(getLS('subscriptionUpdateFileNames') || []),
    message: {},
});

/**
 * redux reducer for subscription update
 */
const reducer = (state = initialState, action) => {
    let hasUpdate = state.get('hasUpdate');
    let fileNames = [];
    switch (action.type) {
        case SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE:
            setLS('hasSubscriptionUpdate', false);
            setLS('subscriptionUpdateFileNames', []);
            return state.set('fetchingSubscriptionUpdate', API_REQUEST_STATE.START).set('hasUpdate', false).set('fileNames', List([])).set('error', null);
        case SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE_FULFILLED:
            fileNames = action.payload?.files_name || [];
            hasUpdate = fileNames.length > 0;
            setLS('hasSubscriptionUpdate', hasUpdate);
            setLS('subscriptionUpdateFileNames', fileNames);
            return state.set('fetchingSubscriptionUpdate', API_REQUEST_STATE.FINISH).set('hasUpdate', hasUpdate).set('fileNames', List(fileNames));
        case SubscriptionUpdate.FETCH_SUBSCRIPTIONUPDATE_REJECTED:
            return state.set('fetchingSubscriptionUpdate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case SubscriptionUpdate.DO_SUBSCRIPTIONUPDATE:
            return state.set('doingSubscriptionUpdate', API_REQUEST_STATE.START).set('error', null);
        case SubscriptionUpdate.DO_SUBSCRIPTIONUPDATE_FULFILLED:
            return state.set('doingSubscriptionUpdate', API_REQUEST_STATE.FINISH);
        case SubscriptionUpdate.DO_SUBSCRIPTIONUPDATE_REJECTED:
            return state.set('doingSubscriptionUpdate', API_REQUEST_STATE.ERROR).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as subscription_update};