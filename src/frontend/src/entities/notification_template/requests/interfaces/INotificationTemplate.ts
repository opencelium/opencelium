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

import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import { INotificationTemplate } from "../../interfaces/INotificationTemplate";

export interface INotificationTemplateRequest{

    /*
    * TODO: do not exist such method on the server
    */
    //to check if notification template with such name already exists
    checkNotificationTemplateName(): Promise<AxiosResponse<IResponse>>,

    //to get notification template by id
    getNotificationTemplateById(): Promise<AxiosResponse<INotificationTemplate>>,

    //to get all notification template by type
    getAllNotificationTemplatesByType(): Promise<AxiosResponse<INotificationTemplate[]>>,

    //to get all notification templates by authorized user
    getAllNotificationTemplates(): Promise<AxiosResponse<INotificationTemplate[]>>,

    //to add notification template
    addNotificationTemplate(notificationTemplate: INotificationTemplate): Promise<AxiosResponse<INotificationTemplate>>,

    //to update notification template
    updateNotificationTemplate(notificationTemplate: INotificationTemplate): Promise<AxiosResponse<INotificationTemplate>>,

    //to delete notification template by id
    deleteNotificationTemplateById(): Promise<AxiosResponse<INotificationTemplate>>,

    //to delete notification templates by id
    deleteNotificationTemplatesById(notificationTemplate: number[]): Promise<AxiosResponse<number[]>>,
}