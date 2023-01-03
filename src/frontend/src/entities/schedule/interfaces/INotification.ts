/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import {IForm} from "@application/interfaces/core";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import {INotificationTemplate} from "@entity/notification_template/interfaces/INotificationTemplate";
import {NotificationState} from "../redux_toolkit/slices/NotificationSlice";

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
    addToSelectedSchedules: (ids: number[]) => boolean;
    update: () => boolean;
    deleteById: () => boolean;
}

export interface INotification extends INotificationForm{
    id?: number;
    selectedScheduleIds?: number[];
    notificationId?: number;
    scheduleId?: number,
    schedulerId?: number,
    type: string,
    notificationType?: string,
    template: INotificationTemplate,
    recipients: string[],
}
