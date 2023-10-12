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

import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import IUser from "@entity/user/interfaces/IUser";
import {INotification} from "../../interfaces/INotification";
import {INotificationRequest} from "../../requests/interfaces/INotification";


export class NotificationRequest extends Request implements INotificationRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'scheduler', ...settings});
    }

    async checkNotificationName(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getNotificationById(): Promise<AxiosResponse<INotification>>{
        return super.get<INotification>();
    }

    async getNotificationByScheduleIdAndId(): Promise<AxiosResponse<INotification>>{
        return super.get<INotification>();
    }

    async getAllNotificationsByScheduleId(): Promise<AxiosResponse<INotification[]>>{
        return super.get<INotification[]>();
    }

    async getNotificationRecipients(): Promise<AxiosResponse<IUser[]>>{
        this.url = 'user/all';
        return super.get<IUser[]>();
    }

    async addNotification(notification: INotification): Promise<AxiosResponse<INotification>>{
        return super.post<INotification>(this.backendMap(notification));
    }

    async updateNotification(notification: INotification): Promise<AxiosResponse<INotification>>{
        return super.put<INotification>(this.backendMap(notification));
    }

    async deleteNotificationById(): Promise<AxiosResponse<INotification>>{
        return super.delete<INotification>();
    }

    backendMap(notification: INotification){
        let mappedNotification: any = {
            name: notification.name,
            eventType: notification.eventType,
            notificationType: notification.typeSelect.value,
            template: {templateId: notification.templateSelect.value, name: notification.templateSelect.label},
            recipients: notification.recipientsSelect.map(recipient => recipient.value),
            schedulerId: notification.scheduleId,
        };
        switch (mappedNotification.notificationType){
            case 'email':
                mappedNotification.recipients = notification.recipientsSelect.map(recipient => recipient.value);
                break;
            case 'teams':
                mappedNotification.team = notification.teamSelect.value;
                mappedNotification.channel = notification.channelSelect.value;
                break;
        }
        if(notification.id !== 0){
            return {
                notificationId: notification.id,
                ...mappedNotification,
            }
        }
        return mappedNotification;
    }
}
