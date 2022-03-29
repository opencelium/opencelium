import {IForm} from "@interface/application/core";
import {OptionProps} from "@atom/input/select/interfaces";
import {NotificationState} from "@slice/schedule/NotificationSlice";
import {INotificationTemplate} from "@interface/schedule/INotificationTemplate";

export enum EVENT_TYPE{
    POST= 'post',
    PRE= 'pre',
    ALERT= 'alert',
}

export interface INotificationRadios{
    eventType: EVENT_TYPE,
}

export interface INotificationSelect{
    typeSelect: OptionProps;
    templateSelect: OptionProps,
    recipientsSelect: OptionProps[];
}

export interface INotificationText{
    name: string;
}

export interface INotificationForm extends INotificationText, INotificationSelect, INotificationRadios, IForm<INotificationText, INotificationSelect, INotificationRadios, {}, {}, {}>{
    reduxState?: NotificationState;
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
}

export interface INotification extends INotificationForm{
    id?: number;
    notificationId?: number;
    scheduleId?: number,
    schedulerId?: number,
    type: string,
    notificationType?: string,
    template: INotificationTemplate,
    recipients: string[],
}
