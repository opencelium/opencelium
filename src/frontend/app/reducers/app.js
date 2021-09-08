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

import {AppAction} from '@utils/actions';
import i18n from '../utils/i18n';
import {defaultLanguage} from "@utils/constants/languages";

import {getLS, setLS} from '@utils/LocalStorage';
import {API_REQUEST_STATE} from "@utils/constants/app";
import {VIEW_TYPE} from "@components/general/list_of_components/List";

const viewType = getLS('viewType');
const gridViewType = getLS('gridViewType');

const initialState = fromJS({
    currentLanguage: defaultLanguage.code,
    addingErrorTicket: API_REQUEST_STATE.INITIAL,
    fetchingAppVersion: API_REQUEST_STATE.INITIAL,
    fetchingDataForSearch: API_REQUEST_STATE.INITIAL,
    dataForSearch: null,
    currentPageItems: [],
    isComponentExternalInChangeContent: false,
    appVersion: '',
    currentMenu: {},
    error: null,
    message: {},
    isFullScreen: false,
    isDraftOpenedOnce: false,
    viewType: viewType ? viewType : VIEW_TYPE.LIST,
    gridViewType: gridViewType ? gridViewType : '4',
});

/**
 * redux reducer for app
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case AppAction.FETCH_DATAFORSEARCH:
            return state.set('fetchingDataForSearch', API_REQUEST_STATE.START).set('error', null);
        case AppAction.FETCH_DATAFORSEARCH_FULFILLED:
            return state.set('fetchingDataForSearch', API_REQUEST_STATE.FINISH).set('dataForSearch', action.payload);
        case AppAction.FETCH_DATAFORSEARCH_REJECTED:
            return state.set('fetchingDataForSearch', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case AppAction.SET_VIEW_TYPE:
            setLS('viewType', action.payload);
            return state.set('viewType', action.payload);
        case AppAction.SET_GRID_VIEW_TYPE:
            setLS('gridViewType', action.payload);
            return state.set('gridViewType', action.payload);
        case AppAction.CHANGE_LANGUAGE:
            i18n.changeLanguage(action.payload.code);
            return state.set('currentLanguage', action.payload.code);
        case AppAction.SET_COMPONENTINCHANGECONTENT:
            return state.set('isComponentExternalInChangeContent', action.payload);
        case AppAction.UPDATE_MENU:
            setLS("currentMenu", action.payload);
            return state.set('currentMenu', action.payload);
        case AppAction.ADD_ERRORTICKET:
            return state.set('addingErrorTicket', API_REQUEST_STATE.START).set('error', null);
        case AppAction.ADD_ERRORTICKET_FULFILLED:
            return state.set('addingErrorTicket', API_REQUEST_STATE.FINISH);
        case AppAction.ADD_ERRORTICKET_REJECTED:
            return state.set('addingErrorTicket', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case AppAction.FETCH_APPVERSION:
            return state.set('fetchingAppVersion', API_REQUEST_STATE.START).set('error', null);
        case AppAction.FETCH_APPVERSION_FULFILLED:
            return state.set('fetchingAppVersion', API_REQUEST_STATE.FINISH).set('appVersion', action.payload.version);
        case AppAction.FETCH_APPVERSION_REJECTED:
            return state.set('fetchingAppVersion', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case AppAction.SET_CURRENT_PAGE_ITEMS:
            return state.set('currentPageItems', List(action.payload));
        case AppAction.SET_FORM_SECTION_FULL_SCREEN:
            return state.set('isFullScreen', action.payload);
        case AppAction.SET_CONNECTION_DRAFT_TO_OPEN_ONCE:
            return state.set('isDraftOpenedOnce', true);
        default:
            return state;
    }
};


export {initialState, reducer as app};