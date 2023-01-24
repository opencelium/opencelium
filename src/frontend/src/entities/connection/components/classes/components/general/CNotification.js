/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import ReactDOMServer from "react-dom/server";
import React from "react";
import {NotificationMessageHandlers, NotificationType} from "@entity/connection/components/utils/constants/notifications/notifications";
import i18n from "@application/utils/i18n";
import {isString, stringToHTML} from "@application/utils/utils";
import styles from "@entity/connection/components/themes/default/layout/notification.scss";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import {parseConnectionPointer} from "@application/utils/utils";

export class CNotification{
    static getMessage(t, notification, renderServerMessage = null){
        let {type, message, params} = notification;
        let serverMessageLength = 0;
        let notificationMessage = type + '.' + message;
        if(NotificationMessageHandlers[type] && NotificationMessageHandlers[type][message]){
            notificationMessage = NotificationMessageHandlers[type][message](params);
            serverMessageLength = stringToHTML(ReactDOMServer.renderToString(notificationMessage)).innerText.length;
        } else{
            let comingMessage = params && params.hasOwnProperty('response') && params.response && params.response.hasOwnProperty('message') ? params.response.message : '';
            if(comingMessage === ''){
                comingMessage = params && params.hasOwnProperty('message') && params.message !== 'No message available' && params.message !== 'ajax error 0' ? params.message : '';
            }
            if(comingMessage){
                if(i18n.exists(`notifications:${type}.${message}.${comingMessage}`)) {
                    if(params.hasOwnProperty('response') && params.response.hasOwnProperty('data') && params.response.data.hasOwnProperty('connectionPointer')){
                        let connectionPointer = parseConnectionPointer(params.response.data.connectionPointer);
                        if(connectionPointer.field !== '' && connectionPointer.color !== '') {
                            notificationMessage = t(type + '.' + message + '.' + comingMessage, {methodPath: connectionPointer.field});
                            const serverMessage = renderServerMessage ? renderServerMessage(`${notificationMessage} ${connectionPointer.color}`) : notificationMessage;
                            notificationMessage = serverMessage.message;
                            serverMessageLength = serverMessage.length;
                        } else{
                            notificationMessage = t(type + '.' + message + '.' + comingMessage);
                        }
                    } else {
                        notificationMessage = t(type + '.' + message + '.' + comingMessage);
                        if (notificationMessage === `${type}.${message}.${comingMessage}`) {
                            notificationMessage = t(`${type}.${message}.__DEFAULT__`);
                        }
                    }
                } else{
                    const serverMessage = renderServerMessage ? renderServerMessage(comingMessage) : comingMessage;
                    notificationMessage = isString(serverMessage) ? serverMessage : serverMessage.message;
                    serverMessageLength = isString(serverMessage) ? serverMessage.length : serverMessage.length;
                }
            } else {
                if (i18n.exists(`notifications:${type}.${message}.__DEFAULT__`)) {
                    notificationMessage = t(`${type}.${message}.__DEFAULT__`);
                } else{
                    if(i18n.exists(`notifications:${type}.${message}`)){
                        notificationMessage = t(`${type}.${message}`);
                    } else{
                        notificationMessage = message;
                    }
                }
            }
        }
        let length = isString(notificationMessage) ? notificationMessage.length : serverMessageLength;
        return {message: notificationMessage, length};
    }

    static getTypeData(type){
        let tooltip = '';
        let value = '';
        let iconClassName = '';
        switch (type){
            case NotificationType.SUCCESS:
                tooltip = 'Info';
                value = 'info';
                iconClassName = styles.info_icon;
                break;
            case NotificationType.WARNING:
                iconClassName = styles.warning_icon;
                break;
            case NotificationType.ERROR:
                tooltip = 'Error';
                value = 'cancel';
                iconClassName = styles.error_icon;
                break;
        }
        return {
            tooltip,
            value,
            iconClassName,
        }
    }

    static getTypeIcon(type, size = 20){
        const {tooltip, value, iconClassName} = CNotification.getTypeData(type);
        if(type !== 'warning'){
            return(
                <TooltipFontIcon wrapClassName={styles.type_icon} className={iconClassName} size={size}
                                 value={value} tooltip={tooltip}/>
            );
        } else{
            return (<div className={iconClassName}><div>!</div></div>);
        }
    }
}