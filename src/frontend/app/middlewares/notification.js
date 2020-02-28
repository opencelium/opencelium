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

import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';

import Notification from '../components/general/app/Notification';
import {EntitiesWithNotification, NotificationType} from '../utils/constants/notifications/notifications';
import i18n from "../utils/i18n";
import {sessionExpired} from "../actions/auth";
import {AuthAction} from "../utils/actions";

import {history} from '../components/App';
import {TOKEN_EXPIRED_MESSAGES} from "../utils/app";
import Loading from "../components/general/app/Loading";


/**
 * display notification after performing request if they are defined
 */
export default function (store){
    return next => action => {
        let systemTitle = action.payload && action.payload.hasOwnProperty('systemTitle') ? action.payload.systemTitle : 'OC';
        let data = {type: '', message: '', systemTitle};
        const dividedState = divideState(action.type);
        if(hasNotification(dividedState) && isNotBackground(action)) {
            data.message = dividedState.prefix;
            switch (dividedState.postfix) {
                case 'FULFILLED':
                    data.type = NotificationType.SUCCESS;
                    break;
                case 'REJECTED':
                    data.type = NotificationType.ERROR;
                    if (action.payload && (action.payload.status === 403 || TOKEN_EXPIRED_MESSAGES.indexOf(action.payload.message) !== -1)){
                        store.dispatch(sessionExpired({}));
                        history.push('/login');
                        next({type: AuthAction.INITIAL_STATE, payload: {}});
                        return;
                    }
                    break;
                case 'CANCELED':
                    data.type = NotificationType.WARNING;
                    break;
                case 'STORE':
                    data.type = NotificationType.NOTE;
                    break;
            }
            const notification = document.getElementById('notification');
            let idName = 'note_';
            if(notification.children.length === 0 || typeof notification.children[notification.children.length - 1].children[0] === 'undefined') {
                idName += 1;
            }else{
                let nextIndex = notification.children[notification.children.length - 1].children[0].id;
                nextIndex = nextIndex.split('_');
                idName += parseInt(nextIndex[1]) + 1;
            }
            const newDiv = document.createElement("div");
            notification.appendChild(newDiv);
            let domElem = notification.children[notification.children.length - 1];
            setTimeout(function(){
                document.getElementById(idName).parentNode.remove();
            }, 5500);
            ReactDOM.render(
                <Suspense fallback={(<Loading/>)}>
                    <Notification data={data} id={idName} params={action.payload}/>
                </Suspense>, domElem);
        }
        next(action);
    };
}

/**
 * check of the request happens on the background, then do not notify
 */
function isNotBackground(action){
    if(action.hasOwnProperty('settings')){
        if(action.settings.hasOwnProperty('onBackground')){
            return !action.settings.onBackground;
        }
    }
    return true;
}

/**
 * check if the request has notification using EntitiesWithNotification variable
 */
function hasNotification(data){
    const result = EntitiesWithNotification.find((entity) => {
        if(entity.name === data.prefix){
            if(entity.types.find((type) => type === data.postfix)){
                return true;
            }
        }
        return false;
    });
    return typeof result !== 'undefined';
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
