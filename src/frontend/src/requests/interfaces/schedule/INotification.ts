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

import {AxiosResponse} from "axios";
import { INotification } from "@interface/schedule/INotification";
import {IResponse} from "../application/IResponse";
import {IUser} from "@interface/user/IUser";

export interface INotificationRequest{

    /*
    * TODO: do not exist such method on the server
    */
    //to check if notification with such name already exists
    checkNotificationName(): Promise<AxiosResponse<IResponse>>,

    //to get notification by id
    getNotificationById(): Promise<AxiosResponse<INotification>>,

    //to get notification by id and schedule id
    getNotificationByScheduleIdAndId(): Promise<AxiosResponse<INotification>>,

    //to get all notifications by schedule id
    getAllNotificationsByScheduleId(): Promise<AxiosResponse<INotification[]>>,

    //to get recipients of notification
    getNotificationRecipients(): Promise<AxiosResponse<IUser[]>>,

    //to add notification
    addNotification(notificationTemplate: INotification): Promise<AxiosResponse<INotification>>,

    //to update notification
    updateNotification(notificationTemplate: INotification): Promise<AxiosResponse<INotification>>,

    //to delete notification by id
    deleteNotificationById(): Promise<AxiosResponse<INotification>>,
}