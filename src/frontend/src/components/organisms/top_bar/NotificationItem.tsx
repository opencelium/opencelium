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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {NotificationItemProps} from './interfaces';
import {NotificationAmountStyled, NotificationItemStyled, SingleCalloutStyled} from './styles';
import TooltipButton from "@molecule/tooltip_button/TooltipButton";
import {ColorTheme} from "../../general/Theme";
import {useAppDispatch} from "../../../hooks/redux";
import {toggleNotificationPanel} from '@slice/application/ApplicationSlice';
import {Application} from "@class/application/Application";
import {CNotification} from "@class/application/Notification";
import Callout from "@organism/top_bar/Callout";
import {Auth} from "@class/application/Auth";
import {isString} from "../../utils";
import Text from "@atom/text/Text";
import {TextSize} from "@atom/text/interfaces";

const NotificationItem: FC<NotificationItemProps> =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const {isAuth} = Auth.getReduxState();
    const {notifications} = Application.getReduxState();
    const [notificationAmount, setNotificationAmount] = useState(notifications.length);
    const [lastNotification, setLastNotification] = useState(null);
    let calloutMessage = lastNotification ? lastNotification.getMessageData().message : '';
    if(calloutMessage && isString(calloutMessage)){
        calloutMessage = <Text value={calloutMessage} transKey={calloutMessage} size={TextSize.Size_14}/>
    }
    useEffect(() => {
        if(notificationAmount < notifications.length){
            setLastNotification(notifications.length > 0 ? new CNotification(notifications[0]) : null);
            setTimeout(() => setLastNotification(null), 3000)
        }
        setNotificationAmount(notifications.length);
    },[notifications.length]);
    const isDisabled = notifications.length === 0;
    const notificationAmountText = notificationAmount > 99 ? `+99` : notificationAmount;
    if(!isAuth){
        return(
            <SingleCalloutStyled>
                {calloutMessage && <Callout icon={lastNotification.getTypeIcon()} message={calloutMessage} hasFoot={false}/>}
            </SingleCalloutStyled>
        )
    }
    return (
        <NotificationItemStyled>
            {calloutMessage && <Callout icon={lastNotification.getTypeIcon()} message={calloutMessage}/>}
            {notificationAmount !== 0 && <NotificationAmountStyled onClick={() => dispatch(toggleNotificationPanel())}>{notificationAmountText}</NotificationAmountStyled>}
            <TooltipButton isDisabled={isDisabled} handleClick={() => dispatch(toggleNotificationPanel())} size={24} target={'button_notifications'} tooltip={'Notifications'} icon={'notifications'} position={'bottom'} color={isDisabled ? ColorTheme.Gray : ColorTheme.Black} hasBackground={false}/>
        </NotificationItemStyled>
    )
}

NotificationItem.defaultProps = {
}


export {
    NotificationItem,
};

export default withTheme(NotificationItem);