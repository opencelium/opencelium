/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React from "react";
import {INotification, NotificationType} from "@interface/application/INotification";
import {ColorTheme} from "../../components/general/Theme";
import {TypeIconStyled, WarningIconStyled} from "@molecule/notification/styles";
import FulfilledInterpolations from "@translations/interpolations";
import {stringToHTML} from "../../components/utils";
import i18next from "i18next";
import {getActionWithoutType, reactElementToText} from "../../utils";
import {AppDispatch} from "@store/store";
import {NavigateFunction} from "react-router";
import {login} from "@action/application/AuthCreators";
import {ResponseMessages} from "@requestInterface/application/IResponse";

export class CNotification implements INotification{
    id: string | number;
    title?: string = 'OC';
    createdTime: string;
    actionType: string;
    type: NotificationType;
    params?: any = null;
    static MAX_NOTIFICATION_MESSAGE_LENGTH = 250;

    constructor(notification: Partial<INotification>) {
        this.id = notification?.id || 0;
        this.title = notification?.title || 'OC';
        this.actionType = notification?.actionType || '';
        this.createdTime = notification?.createdTime || '';
        this.type = notification?.type || NotificationType.NOTE;
        this.params = notification?.params || null;
    }

    static getAccessDeniedMessage(message?: string): INotification{
        const date = new Date();
        return {
            id: date.getTime(),
            type: NotificationType.ERROR,
            title: 'OC',
            actionType: login.rejected.type,
            createdTime: date.getTime().toString(),
            params: {message: message || ResponseMessages.NETWORK_ERROR}
        };
    }

    getMessageData(onClick?: any, dispatch?: AppDispatch, navigate?: NavigateFunction){
        let messageData: {message: any, length: number, dialogMessage?: any} = {message: '', length: 0};
        let interpolations: any = {};
        for(let param in FulfilledInterpolations){
            // @ts-ignore
            interpolations = {...interpolations, ...FulfilledInterpolations[param]};
        }
        const translationKey = `notifications.${this.type}.${this.actionType}`;
        let interpolationName = getActionWithoutType(this.actionType);
        if(interpolations.hasOwnProperty(interpolationName) && this.type !== NotificationType.ERROR && !this.params.hasOwnProperty('message')){
            messageData.message = interpolations[interpolationName](this.type, dispatch, navigate, this.params);
        } else{
            if(this.params?.message){
                if(i18next.exists(`${translationKey}.${this.params.message}`)){
                    messageData.message = `${translationKey}.${this.params.message}`;
                } else{
                    messageData.message = `${translationKey}.__DEFAULT__`;
                }
            } else{
                messageData.message = translationKey;
            }
        }
        const clearText = stringToHTML(reactElementToText(messageData.message)).innerText
        messageData.length = clearText.length;
        if(messageData.length > CNotification.MAX_NOTIFICATION_MESSAGE_LENGTH) {
            const shortMessage = clearText.substr(0, CNotification.MAX_NOTIFICATION_MESSAGE_LENGTH);
            messageData.dialogMessage = messageData.message;
            messageData.message = <span>
                {`${shortMessage}... (`}
                <a id='notification_url' href='' onClick={(e) => onClick(e)}>Details</a>
                {')'}
            </span>;
        }
        return messageData;
    }

    getTypeIcon(){
        let tooltip = '';
        let value = '';
        let iconColor = ColorTheme.Black;
        switch (this.type){
            case NotificationType.SUCCESS:
                tooltip = 'Info';
                value = 'info';
                break;
            case NotificationType.ERROR:
                iconColor = ColorTheme.Red;
                tooltip = 'Error';
                value = 'cancel';
                break;
        }
        if(this.type !== NotificationType.WARNING){
            return(
                <TypeIconStyled target={`notification_type_icon_${this.id}`} color={iconColor} size={20} name={value} tooltip={tooltip}/>
            );
        } else{
            return (<WarningIconStyled><div>!</div></WarningIconStyled>);
        }
    }
}