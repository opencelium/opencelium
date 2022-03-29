import ReactDOMServer from "react-dom/server";
import React from "react";
import {NotificationMessageHandlers, NotificationType} from "@utils/constants/notifications/notifications";
import i18n from "@utils/i18n";
import {isString, parseConnectionPointer, stringToHTML} from "@utils/app";
import styles from "@themes/default/layout/notification";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

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