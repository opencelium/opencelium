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
import {IContent, INotificationTemplate} from "../../interfaces/INotificationTemplate";
import {
    DeleteNotificationTemplatesByIdRequestProps,
    INotificationTemplateRequest
} from "../interfaces/INotificationTemplate";


export class NotificationTemplateRequest extends Request implements INotificationTemplateRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'message', ...settings});
    }

    async checkNotificationTemplateName(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getNotificationTemplateById(): Promise<AxiosResponse<INotificationTemplate>>{
        return super.get<INotificationTemplate>();
    }

    async getAllNotificationTemplatesByType(): Promise<AxiosResponse<INotificationTemplate[]>>{
        return super.get<INotificationTemplate[]>();
    }

    async getAllNotificationTemplates(): Promise<AxiosResponse<INotificationTemplate[]>>{
        return super.get<INotificationTemplate[]>();
    }

    async addNotificationTemplate(notificationTemplate: INotificationTemplate): Promise<AxiosResponse<INotificationTemplate>>{
        return super.post<INotificationTemplate>(this.backendMap(notificationTemplate));
    }

    async updateNotificationTemplate(notificationTemplate: INotificationTemplate): Promise<AxiosResponse<INotificationTemplate>>{
        return super.post<INotificationTemplate>(this.backendMap(notificationTemplate));
    }

    async deleteNotificationTemplateById(): Promise<AxiosResponse<INotificationTemplate>>{
        return super.delete<INotificationTemplate>();
    }

    async deleteNotificationTemplatesById(data: DeleteNotificationTemplatesByIdRequestProps): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/list/delete';
        return super.put<IResponse>(data);
    }

    backendMap(notificationTemplate: INotificationTemplate){
        let content: IContent = {subject: notificationTemplate.content.subject, body: notificationTemplate.content.body, language: 'en'};
        if(notificationTemplate.content.contentId !== 0){
            content.contentId = notificationTemplate.content.contentId;
        }
        let mappedNotificationTemplate = {
            name: notificationTemplate.name,
            type: notificationTemplate.typeSelect.value,
            content: [content],
        };
        if(notificationTemplate.id !== 0){
            return {
                templateId: notificationTemplate.id,
                ...mappedNotificationTemplate,
            }
        }
        return mappedNotificationTemplate;
    }
}
