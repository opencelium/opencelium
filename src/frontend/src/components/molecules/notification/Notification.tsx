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

import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import {
    CreatedTimeStyled,
    DeleteButtonStyled,
    MessageStyled,
    NotificationStyled,
    TitleStyled,
    TitleTextStyled,
    TransparentGradientStyled,
    UnFoldIconStyled,
} from './styles';
import TimeAgo from "timeago-react";
import {NotificationProps} from "@organism/notification_panel/interfaces";
import Dialog from "@atom/dialog/Dialog";
import {ColorTheme} from "../../general/Theme";
import Text from "@atom/text/Text";
import {useAppDispatch} from "../../../hooks/redux";
import { clearNotification } from '@store/reducers/application/ApplicationSlice';
import {isString} from "../../utils";
import {TextSize} from "@atom/text/interfaces";
import {useNavigate} from "react-router";

const Notification: FC<NotificationProps> =
    ({
        notification,
    }) => {
    const dispatch = useAppDispatch();
    let navigate = useNavigate();
    const [isMouseOver, toggleMouseOver] = useState(false);
    const [isFolded, fold] = useState(true);
    const toggleFold = () => {
        if(hasFoldIcon()){
            fold(!isFolded);
        }
    }
    const [isDialogInDetailsVisible, toggleDialogInDetails] = useState(false);
    const openDialogInDetails = (e: MouseEvent) => {
        e.preventDefault();
        toggleDialogInDetails(true);
    }
    const onMouseOver = () => {
        toggleMouseOver(true);
    };
    const onMouseLeave = () => {
        toggleMouseOver(false);
    };
    let messageData = notification.getMessageData(openDialogInDetails, dispatch, navigate);
    const hasFoldIcon = () => {
        return messageData.length > 65;
    }
    let unFoldIcon = {
        tooltip: 'Unfold More',
        value: 'unfold_more',
    }
    if(!isFolded){
        unFoldIcon = {
            tooltip: 'Unfold Less',
            value: 'unfold_less',
        };
    }
    return (
        <NotificationStyled onMouseOver={() => onMouseOver()} onMouseLeave={() => onMouseLeave()}>
            {isMouseOver && hasFoldIcon() &&
                <UnFoldIconStyled
                    color={ColorTheme.Black}
                    target={`notification_unfold_button_${notification.id}`}
                    hasBackground={false}
                    iconSize={TextSize.Size_16}
                    icon={unFoldIcon.value}
                    tooltip={unFoldIcon.tooltip}
                    onClick={() => toggleFold()}
                />
            }
            {isMouseOver &&
                <DeleteButtonStyled
                    color={ColorTheme.Black}
                    target={`notification_delete_button_${notification.id}`}
                    hasBackground={false}
                    iconSize={TextSize.Size_16}
                    icon={'delete'}
                    tooltip={'Clear'}
                    onClick={() => dispatch(clearNotification({...notification}))}
                />
            }
            <TitleStyled>
                {notification.getTypeIcon()}
                <TitleTextStyled value={notification.title}/>
            </TitleStyled>
            <MessageStyled isFolded={isFolded}>
                {isString(messageData.message) ? <Text value={messageData.message} transKey={messageData.message} size={TextSize.Size_14}/> : messageData.message}
                {hasFoldIcon() && isFolded && <TransparentGradientStyled/>}
            </MessageStyled>
            <CreatedTimeStyled size={TextSize.Size_10} value={
                <TimeAgo
                    datetime={notification.createdTime}
                    locale='de_DE'
                />
            }/>
            <Dialog
                actions={[{label: 'Close', onClick: () => toggleDialogInDetails(!isDialogInDetailsVisible), id: 'dialog_close'}]}
                active={isDialogInDetailsVisible}
                toggle={() => toggleDialogInDetails(!isDialogInDetailsVisible)}
                title={'Notification Message'}
            >
                <p style={{overflow: 'auto'}}>
                    <span>{
                        messageData.dialogMessage
                    }</span>
                </p>
            </Dialog>
        </NotificationStyled>
    )
}

export {
    Notification,
};

export default withTheme(Notification);