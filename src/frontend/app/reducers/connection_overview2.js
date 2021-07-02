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

import {List, fromJS, Map} from 'immutable';
import {ConnectionOverview2Action} from "@utils/actions";
import {PANEL_LOCATION, SEPARATE_WINDOW} from "@utils/constants/app";
import {getLS, removeLS, setLS} from "@utils/LocalStorage";
import {isExternalWindow} from "@utils/app";

let initialState = null;
if(isExternalWindow()){
    const localStorageState = getLS('connection_overview', 'connection_overview');
    if(localStorageState){
        initialState = fromJS(localStorageState);
        initialState = initialState.map(value => {
            if(Map.isMap(value)){
                return value.toJS();
            }
            return value;
        });
    }
}

if(initialState === null){
    initialState = fromJS({
        currentBusinessItem: null,
        currentTechnicalItem: null,
        connection: null,
        updateConnection: null,
        items: List([]),
        arrows: List([]),
        error: null,
        message: {},
        notificationData: {},
        detailsLocation: PANEL_LOCATION.SAME_WINDOW,
        businessLayoutLocation: PANEL_LOCATION.SAME_WINDOW,
        technicalLayoutLocation: PANEL_LOCATION.SAME_WINDOW,
        colorMode: 0,
        isAssignMode: false,
    });
}

/**
 * redux reducer for connection overview 2
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case ConnectionOverview2Action.SET_ISASSIGNMODE:
            return state.set('isAssignMode', action.payload);
        case ConnectionOverview2Action.SET_CONNECTIONDATA:
            return state.set('connection', action.payload.connection).set('updateConnection', action.payload.updateConnection);
        case ConnectionOverview2Action.SET_COLORMODE:
            return state.set('colorMode', action.payload);
        case ConnectionOverview2Action.SET_ARROWS:
            return state.set('arrows', List(action.payload));
        case ConnectionOverview2Action.SET_ITEMS:
            return state.set('items', List(action.payload));
        case ConnectionOverview2Action.SET_CURRENTBUSINESSITEM:
            return state.set('currentBusinessItem', action.payload).set('currentTechnicalItem', null);
        case ConnectionOverview2Action.SET_CURRENTECHNICALITEM:
            return state.set('currentTechnicalItem', action.payload).set('isCreateElementPanelOpened', action.payload !== null);
        case ConnectionOverview2Action.SET_DETAILSLOCATION:
            if(action.payload.location === PANEL_LOCATION.SAME_WINDOW)
                removeLS('connection_overview', 'connection_overview');
            return state.set('detailsLocation', action.payload.location);
        case ConnectionOverview2Action.SET_BUSINESSLAYOUTLOCATION:
            if(action.payload.location === PANEL_LOCATION.SAME_WINDOW)
                removeLS('connection_overview', 'connection_overview');
            return state.set('businessLayoutLocation', action.payload.location);
        case ConnectionOverview2Action.SET_TECHNICALLAYOUTLOCATION:
            if(action.payload.location === PANEL_LOCATION.SAME_WINDOW)
                removeLS('connection_overview', 'connection_overview');
            return state.set('technicalLayoutLocation', action.payload.location);
        default:
            return state;
    }
};


export {initialState, reducer as connection_overview};