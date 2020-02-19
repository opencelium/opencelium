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
            if(params && params.hasOwnProperty('message') && params.message !== 'No message available'){
                if(i18n.exists(`notifications:${status}.${message}.${params.message}`)) {
                    notificationMessage = t(status + '.' + message + '.' + params.message);
                    if (notificationMessage === `${status}.${message}.${params.message}`) {
                        notificationMessage = t(`${status}.${message}.__DEFAULT__`);
                    }
                } else{
                    notificationMessage = params.message;
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