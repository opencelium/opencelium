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
import {IResponse} from "@application/requests/interfaces/IResponse";
import { ITemplate } from "../../interfaces/ITemplate";
import ModelTemplate from "../models/Template";

export interface ITemplateRequest{

    //to check if template with such name already exists
    checkTemplateName(): Promise<AxiosResponse<IResponse>>,

    //to import template as a json file
    importTemplate(template: FormData): Promise<AxiosResponse<IResponse>>,

    //to export template
    exportTemplate(): Promise<AxiosResponse<ITemplate>>,

    //to get template by id
    getTemplateById(): Promise<AxiosResponse<ITemplate>>,

    //to get all template of authorized user
    getAllTemplates(): Promise<AxiosResponse<ITemplate[]>>,

    //to add template
    addTemplate(template: ITemplate): Promise<AxiosResponse<ITemplate>>,

    //to update template
    updateTemplate(template: ModelTemplate): Promise<AxiosResponse<ITemplate>>,

    //to update templates
    updateTemplates(template: ITemplate[]): Promise<AxiosResponse<ITemplate[]>>,

    //to delete template by id
    deleteTemplateById(): Promise<AxiosResponse<ITemplate>>,

    //to delete templates by id
    deleteTemplatesById(template: number[]): Promise<AxiosResponse<number[]>>,
}