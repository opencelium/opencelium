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

import React from 'react';
import ReactDOM from 'react-dom';


/**
 * map a list of the responsing data
 */
export default function (store){
    return next => action => {
        let nextAction = action;
        const dividedActionType = divideActionType(action.type);
        switch (dividedActionType.postfix) {
            case 'FULFILLED':
                if(action.payload) {
                    if (action.payload.hasOwnProperty('_embedded')) {
                        let payload = doMapping(action.payload);
                        nextAction = {...action, payload};
                    }
                }
                break;
        }
        next(nextAction);
    };
}

/**
 * parse state of the redux
 */
function divideActionType(actionType){
    const last_ = actionType.lastIndexOf('_');
    const prefix = actionType.substr(0, last_);
    const postfix = actionType.substr(last_ + 1);
    return {prefix, postfix};
}

/**
 * perform mapping removing extra property '_embedded' for Resources and Nodes
 * specifically for Spring framework
 */
function doMapping(data){
    let result = {};
    let hasMapping = false;
    if(data.hasOwnProperty('_embedded')){
        let _embedded = data._embedded;
        for(let key in _embedded){
            if(key.includes('Resource') || key.includes('Nodes')){
                hasMapping = true;
                result = _embedded[key];
                break;
            }
        }
    }
    if(!hasMapping){
        result = data;
    }
    return result;
}
