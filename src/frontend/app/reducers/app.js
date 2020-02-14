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

import {fromJS, List} from 'immutable';

import {AppAction, ComponentsAction} from '../utils/actions';
import i18n from '../utils/i18n';
import {defaultLanguage} from "../utils/constants/languages";

import {setLS} from '../utils/LocalStorage';
import {API_REQUEST_STATE} from "../utils/constants/app";


const initialState = fromJS({
    currentLanguage: defaultLanguage.code,
    addingErrorTicket: API_REQUEST_STATE.INITIAL,
    currentMenu: {},
    error: null,
    message: {},
});

/**
 * (not used) redux reducer for app
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case AppAction.CHANGE_LANGUAGE:
            i18n.changeLanguage(action.payload.code);
            return state.set('currentLanguage', action.payload.code);
        case AppAction.UPDATE_MENU:
            setLS("currentMenu", action.payload);
            return state.set('currentMenu', action.payload);
        case AppAction.ADD_ERRORTICKET:
            return state.set('addingErrorTicket', API_REQUEST_STATE.START).set('error', null);
        case AppAction.ADD_ERRORTICKET_FULFILLED:
            return state.set('addingErrorTicket', API_REQUEST_STATE.FINISH);
        case AppAction.ADD_ERRORTICKET_REJECTED:
            return state.set('addingErrorTicket', API_REQUEST_STATE.ERROR).set('error', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as app};