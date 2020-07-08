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

import Notification from '@components/general/app/Notification';
import {EntitiesWithNotification, NotificationType} from '../utils/constants/notifications/notifications';
import i18n from "../utils/i18n";
import {sessionExpired} from "@actions/auth";
import {AuthAction} from "../utils/actions";

import {history} from '@components/App';
import {TOKEN_EXPIRED_MESSAGES} from "../utils/app";
import Loading from "@components/general/app/Loading";
import styles from "@themes/default/general/app";


/**
 * display notification after performing request if they are defined
 */
export default function (store){
    return next => action => {
        let systemTitle = action.payload && action.payload.hasOwnProperty('systemTitle') ? action.payload.systemTitle : 'OC';
        let notificationType = action.payload && action.payload.hasOwnProperty('notificationType') ? action.payload.notificationType : '';
        let shortMessage = action.payload && action.payload.hasOwnProperty('shortMessage') ? action.payload.shortMessage : '';
        let data = {type: '', message: '', systemTitle, shortMessage};
        const dividedState = divideState(action.type);
        const notification = document.getElementById('notification');
        for(let i = notification.children.length - 1; i >= 0; i--){
            let child = notification.children[i];
            if(child.innerHTML === ''){
                child.remove();
            } else{
                if(action.type === '@@router/LOCATION_CHANGE'){
                    if(child && child.children.length > 0) {
                        let note = child.children[0];
                        if(note.querySelector('#notification_close')){
                            note.classList.remove(styles['notification_show']);
                            note.classList.add(styles['notification_hide']);
                            setTimeout(() => {if(note){note.remove();}}, 1500);
                        }
                    }
                }
            }
        }
        if(hasNotification(dividedState) && isNotBackground(action)) {
            data.message = dividedState.prefix;
            switch (dividedState.postfix) {
                case 'FULFILLED':
                    data.type = NotificationType.SUCCESS;
                    break;
                case 'REJECTED':
                    data.type = NotificationType.ERROR;
                    if(data.message === AuthAction.CHECK_OCCONNECTION){
                        next(action);
                        return;
                    }
                    if (action.payload
                        && (action.payload.status === 403 || TOKEN_EXPIRED_MESSAGES.indexOf(action.payload.message) !== -1)
                    ) {
                        store.dispatch(sessionExpired({}));
                        history.push('/login');
                        next({type: AuthAction.INITIAL_STATE, payload: {}});
                    }
                    break;
                case 'CANCELED':
                    data.type = NotificationType.WARNING;
                    break;
                case 'STORE':
                    data.type = NotificationType.NOTE;
                    break;
            }
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
            if(notificationType !== ''){
                data.type = notificationType;
            }
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
        if(action.settings.hasOwnProperty('background')){
            return !action.settings.background;
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
