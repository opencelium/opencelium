import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {ITemplate} from "@interface/connection/ITemplate";
import {ITemplateRequest} from "../../interfaces/connection/ITemplate";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


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
        return super.post<ITemplate>(this.backendMap(template));
    }

    async updateTemplate(template: ITemplate): Promise<AxiosResponse<ITemplate>>{
        return super.put<ITemplate>(this.backendMap(template));
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

    backendMap(template: ITemplate){
        let mappedTemplate = {
            name: template.name,
            description: template.description,
            version: template.version,
            connection: template.connection,
        };
        if(template.id !== ''){
            return {
                templateId: template.id,
                ...mappedTemplate,
            }
        }
        return mappedTemplate;
    }
}