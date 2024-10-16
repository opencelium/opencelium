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

import {ReactNode} from "react";
import {NavigateFunction} from "react-router";
import {AppDispatch} from "../utils/store";
import {ITheme} from "@style/Theme";


enum NotificationType{
    SUCCESS= 'fulfilled',
    ERROR= 'rejected',
    WARNING= 'WARNING',
    NOTE= 'NOTE',
}

interface INotification{
    theme?: ITheme,
    id: string | number,
    title?: string,
    createdTime: string,
    type: NotificationType,
    actionType: string,
    params?: any,
    getMessageData?: (onClick?: any, dispatch?: AppDispatch, navigate?: NavigateFunction) => {message: any, length: number, dialogMessage?: any},
    getTypeIcon?: () => ReactNode,
}

interface MessageDataProps{
    message: any,
    length: number,
    dialogMessage?: any,
}


export {
    NotificationType,
    INotification,
    MessageDataProps,
}