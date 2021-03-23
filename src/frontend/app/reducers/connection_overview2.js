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
import {ConnectionOverview2Action} from "@utils/actions";




const initialState = fromJS({
    currentItem: null,
    currentSubItem: null,
    items: List([]),
    arrows: List([]),
    error: null,
    message: {},
    notificationData: {},
});

/**
 * redux reducer for connection overview 2
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case ConnectionOverview2Action.SET_ARROWS:
            return state.set('arrows', action.payload);
        case ConnectionOverview2Action.SET_ITEMS:
            return state.set('items', action.payload);
        case ConnectionOverview2Action.SET_CURRENTITEM:
            return state.set('currentItem', action.payload).set('currentSubItem', null);
        case ConnectionOverview2Action.SET_CURRENTSUBITEM:
            return state.set('currentSubItem', action.payload);
        default:
            return state;
    }
};


export {initialState, reducer as connection_overview};