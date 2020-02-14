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

import {fromJS} from 'immutable';
import {LOCATION_CHANGE} from 'react-router-redux';


const initialState = fromJS({
    locationBeforeTransitions: null,
});

/**
 * redux reducer for routing
 */
const reducer = (state = initialState, action) => {
    switch (action.type) {
        case LOCATION_CHANGE:
            return state.merge({
                locationBeforeTransitions: action.payload
            });
        default:
            return state;
    }
};


export {initialState, reducer as routing};