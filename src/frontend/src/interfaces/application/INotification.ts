import {ReactNode} from "react";
import {NavigateFunction} from "react-router";
import {AppDispatch} from "@store/store";
import {ITheme} from "../../components/general/Theme";


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


export {
    NotificationType,
    INotification,
}