import {AxiosResponse} from "axios";
import { ITemplate } from "@interface/connection/ITemplate";
import {IResponse} from "../application/IResponse";

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
    updateTemplate(template: ITemplate): Promise<AxiosResponse<ITemplate>>,

    //to update templates
    updateTemplates(template: ITemplate[]): Promise<AxiosResponse<ITemplate[]>>,

    //to delete template by id
    deleteTemplateById(): Promise<AxiosResponse<ITemplate>>,

    //to delete templates by id
    deleteTemplatesById(template: number[]): Promise<AxiosResponse<number[]>>,
}