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
import {FrontBackMap} from "../utils/app";


/**
 * (only for developing) do mapping between backend and frontend data
 */
export default function (store){
    return next => action => {
        let nextAction = action;
        const dividedActionType = divideActionType(action.type);
        if(dividedActionType.prefix !== 'DELETE' && dividedActionType.prefix !== 'TEST') {
            switch (dividedActionType.postfix) {
                case 'FULFILLED':
                    let payload = doMapping(dividedActionType.fix, action.payload);
                    nextAction = {...action, payload};
                    break;
            }
        }
        next(nextAction);
    };
}

/**
 * parse state of the redux
 */
function divideActionType(actionType){
    const values = actionType.split('_');
    let result = {prefix: '', fix: '', postfix: ''};
    if(values.length >= 2) {
        result.prefix = values[0];
        result.fix = values[1];
        if (values.length === 3) {
            result.postfix = values[2];
        }
    }
    return result;
}

/**
 * perform mapping
 */
function doMapping(entity, payload){
    if(payload) {
        if(entity !== ''){
            if(FrontBackMap.hasOwnProperty(entity)) {
                return FrontBackMap[entity](payload);
            }
        }
    }
    return payload;
}
