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

import {fromJS, List} from 'immutable';

import {DashboardAction} from '@utils/actions';
import {API_REQUEST_STATE} from "@utils/constants/app";
import {INITIAL_WIDGET_SETTINGS} from "@components/content/dashboard/view/settings";


const initialState = fromJS({
    fetchingWidgetSettings: API_REQUEST_STATE.INITIAL,
    updatingWidgetSettings: API_REQUEST_STATE.INITIAL,
    settings: null,
    layout: List([]),
    toolbox: List([]),
    currentWidget: null,
    error: null,
    message: {},
    notificationData: {},
});

/**
 * redux reducer for dashboard
 */
const reducer = (state = initialState, action) => {
    let layout = [];
    let toolbox = [];
    switch (action.type) {
        case DashboardAction.FETCH_WIDGETSETTINGS:
            return state.set('fetchingWidgetSettings', API_REQUEST_STATE.START).set('error', null);
        case DashboardAction.FETCH_WIDGETSETTINGS_FULFILLED:
            layout = action.payload.widgetSettings.map(item => {
                let initial = INITIAL_WIDGET_SETTINGS.find(initialItem => initialItem.i === item.i);
                if(initial){
                    return {
                        ...initial,
                        ...item,
                    };
                } else{
                    return item;
                }
            });
            toolbox = INITIAL_WIDGET_SETTINGS.filter(initialItem => {
                let itemIndex = action.payload.widgetSettings.findIndex(item => item.i === initialItem.i);
                return itemIndex === -1;
            });
            return state.set('fetchingWidgetSettings', API_REQUEST_STATE.FINISH).set('settings', action.payload).set('layout', List(layout)).set('toolbox', List(toolbox));
        case DashboardAction.FETCH_WIDGETSETTINGS_REJECTED:
            return state.set('fetchingWidgetSettings', API_REQUEST_STATE.ERROR).set('error', action.payload);
        case DashboardAction.UPDATE_WIDGETSETTINGS:
            return state.set('updatingWidgetSettings', API_REQUEST_STATE.START).set('error', null).set('settings', action.payload.settings).set('layout', List(action.payload.layout)).set('toolbox', List(action.payload.toolbox)).set('currentWidget', action.payload.currentWidget);
        case DashboardAction.UPDATE_WIDGETSETTINGS_FULFILLED:
            return state.set('updatingWidgetSettings', API_REQUEST_STATE.FINISH);
        case DashboardAction.UPDATE_WIDGETSETTINGS_REJECTED:
            return state.set('updatingWidgetSettings', API_REQUEST_STATE.ERROR).set('error', action.payload).set('currentWidget', null);
        default:
            return state;
    }
};


export {initialState, reducer as dashboard};