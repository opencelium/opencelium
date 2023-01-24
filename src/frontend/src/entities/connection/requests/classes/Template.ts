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
import {ITemplate} from "../../interfaces/ITemplate";
import {ITemplateRequest} from "../interfaces/ITemplate";
import ModelTemplate from "../models/Template";

export class TemplateRequest extends Request implements ITemplateRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'template', ...settings});
    }

    async checkTemplateName(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async importTemplate(template: FormData): Promise<AxiosResponse<IResponse>>{
        this.url = 'storage/template';
        return super.post<IResponse>(template);
    }

    async exportTemplate(): Promise<AxiosResponse<ITemplate>>{
        return super.get<ITemplate>();
    }

    async getTemplateById(): Promise<AxiosResponse<ITemplate>>{
        return super.get<ITemplate>();
    }

    async getAllTemplates(): Promise<AxiosResponse<ITemplate[]>>{
        return super.get<ITemplate[]>();
    }

    async addTemplate(template: ITemplate): Promise<AxiosResponse<ITemplate>>{
        return super.post<ITemplate>(template);
    }

    async updateTemplate(template: ModelTemplate): Promise<AxiosResponse<ITemplate>>{
        return super.put<ITemplate>(template);
    }

    async updateTemplates(templates: ITemplate[]): Promise<AxiosResponse<ITemplate[]>>{
        this.endpoint = '/all';
        return super.put<ITemplate[]>(templates);
    }

    async deleteTemplateById(): Promise<AxiosResponse<ITemplate>>{
        return super.delete<ITemplate>();
    }

    async deleteTemplatesById(templateIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: templateIds});
    }
}