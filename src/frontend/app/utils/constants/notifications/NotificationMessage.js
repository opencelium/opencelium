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

import React, {Component} from 'react';
import {withTranslation} from "react-i18next";
import i18n from '../../i18n';

import {NotificationMessageHandlers} from './notifications';


/**
 * Notification Message component for displaying a notification text
 */
@withTranslation('notifications')
class NotificationMessage extends Component{
    constructor(props){
        super(props);
    }

    render() {
        const {t, status, message, params} = this.props;
        let notificationMessage = status + '.' + message;
        if(NotificationMessageHandlers[status] && NotificationMessageHandlers[status][message]){
            notificationMessage = NotificationMessageHandlers[status][message](params);
        } else{
            let comingMessage = params && params.hasOwnProperty('response') && params.response.hasOwnProperty('message') ? params.response.message : '';
            if(comingMessage === ''){
                comingMessage = params &&  params.hasOwnProperty('message') && params.message !== 'No message available' ? params.message : '';
            }
            if(comingMessage){
                if(i18n.exists(`notifications:${status}.${message}.${comingMessage}`)) {
                    notificationMessage = t(status + '.' + message + '.' + comingMessage);
                    if (notificationMessage === `${status}.${message}.${comingMessage}`) {
                        notificationMessage = t(`${status}.${message}.__DEFAULT__`);
                    }
                } else{
                    let colorRegExp = /^(.*)#[0-9a-f]{6}(.*)/gi;
                    let checkColorRegExp = colorRegExp.exec(comingMessage);
                    if(checkColorRegExp && checkColorRegExp.length > 2){
                        let color = comingMessage.substring(checkColorRegExp[1].length, checkColorRegExp[1].length + 7);
                        let colorStyles = {height: '17px', width: '40px', display: 'inline-block', margin: '0 5px'};
                        notificationMessage = <span>{checkColorRegExp[1]}<span style={{...colorStyles, background: color}}/>{checkColorRegExp[2]}</span>;
                    } else{
                        notificationMessage = comingMessage;
                    }
                }
            } else {
                if (i18n.exists(`notifications:${status}.${message}.__DEFAULT__`)) {
                    notificationMessage = t(`${status}.${message}.__DEFAULT__`);
                } else{
                    notificationMessage = t(`${status}.${message}`);
                }
            }
        }
        return (
            <span>{notificationMessage}</span>
        );
    }
}


export default NotificationMessage;