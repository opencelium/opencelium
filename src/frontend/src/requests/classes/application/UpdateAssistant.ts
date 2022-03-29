import {Request} from "./Request";
import {AxiosResponse} from "axios";
import {IUpdateAssistantRequest, OnlineUpdateProps, OfflineUpdateProps} from "../../interfaces/application/IUpdateAssistant";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


export class UpdateAssistantRequest extends Request implements IUpdateAssistantRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'assistant/oc', ...settings});
    }

    async getOnlineUpdates(): Promise<AxiosResponse<OnlineUpdateProps[]>>{
        this.endpoint = '/online/versions';
        return super.get<OnlineUpdateProps[]>();
    }

    async getOfflineUpdates(): Promise<AxiosResponse<OfflineUpdateProps[]>>{
        this.endpoint = '/offline/versions';
        return super.get<OfflineUpdateProps[]>();
    }

    async uploadApplicationFile(application: FormData): Promise<AxiosResponse<IResponse>>{
        this.url = 'storage/assistant/zipfile';
        return super.post<IResponse>(application);
    }

    async deleteApplicationFile(): Promise<AxiosResponse<IResponse>>{
        this.url = 'storage/assistant/zipfile';
        return super.delete<IResponse>();
    }

    async checkApplicationBeforeUpdate(): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/restart/file/exists';
        return super.get<IResponse>();
    }

    async updateApplication(data: any): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/migrate';
        return super.post<IResponse>(data);
    }
}