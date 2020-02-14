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

import React from 'react';
import ReactDOM from 'react-dom';

/**
 * display notification if find an error in the response of the request
 */
export default function (store){
    return next => action => {
        let nextAction = action;
        if(action.type) {
            const dividedState = divideState(action.type);
            switch (dividedState.postfix) {
                case 'FULFILLED':
                    if (hasError(action.payload)) {
                        nextAction = {
                            ...action,
                            type: dividedState.prefix + '_REJECTED',
                            payload: action.payload.error
                        };
                    }
                    break;
            }
        }
        next(nextAction);
    };
}

/**
 * parse state of the redux
 */
function divideState(state){
    const last_ = state.lastIndexOf('_');
    const prefix = state.substr(0, last_);
    const postfix = state.substr(last_ + 1);
    return {prefix, postfix};
}

/**
 * find error in the response
 */
function hasError(response){
    if(response) {
        if (response.hasOwnProperty('error') && response.error !== 'OK') {
            return true;
        }
    }
    return false;
}
