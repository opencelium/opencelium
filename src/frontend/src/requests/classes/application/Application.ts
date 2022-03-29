import {Request} from "./Request";
import {AxiosResponse} from "axios";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {
    ResourcesProps,
    ApplicationVersionResponseProps,
    GlobalSearchResponseProps,
    IApplicationRequest, RemoteApiRequestProps, RemoteApiResponseProps
} from "../../interfaces/application/IApplication";
import {errorTicketUrl} from "@request/application/url";
import {ITicket} from "@interface/application/ITicket";
import {IResponse} from "../../interfaces/application/IResponse";
import {IComponent} from "@interface/application/IComponent";


export class ApplicationRequest extends Request implements IApplicationRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: '', ...settings});
    }

    async remoteApiRequest(data: RemoteApiRequestProps): Promise<AxiosResponse<RemoteApiResponseProps>>{
        this.url = 'connection/remoteapi/test';
        return super.post<RemoteApiResponseProps>(data);
    }

    async addTicket(ticket: ITicket): Promise<AxiosResponse<IResponse>>{
        this.url = errorTicketUrl;
        return super.post<IResponse>(ticket);
    }

    async getVersion(): Promise<AxiosResponse<ApplicationVersionResponseProps>>{
        this.url = 'assistant/oc/version';
        return super.get<ApplicationVersionResponseProps>();
    }

    async getResources(): Promise<AxiosResponse<ResourcesProps>>{
        this.url = 'assistant/subscription/repo/diff/files'
        return super.get<ResourcesProps>();
    }

    async getGlobalSearchData(): Promise<AxiosResponse<GlobalSearchResponseProps>>{
        this.url = 'search';
        return super.get<GlobalSearchResponseProps>();
    }

    async getAllComponents(): Promise<AxiosResponse<IComponent[]>>{
        this.url = 'component/all';
        return super.get<IComponent[]>();
    }

    async updateResources(): Promise<AxiosResponse<IResponse>>{
        this.url = 'assistant/subscription/repo/update'
        return super.get<IResponse>();
    }

    async openExternalUrl(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }
}