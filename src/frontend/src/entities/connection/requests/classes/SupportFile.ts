import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ISupportFileRequest, {SupportFileResponse} from "@root/requests/interfaces/ISupportFile";


export class SupportFileRequest extends Request implements ISupportFileRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'connection/support-file', ...settings});
    }

    async downloadSupportFile(): Promise<AxiosResponse<Blob>> {
        return super.get<Blob>();
    }

    async downloadSuccessSupportFile(): Promise<AxiosResponse<Blob>> {
        return super.get<Blob>();
    }

    async getSupportFilesByConnection(): Promise<AxiosResponse<SupportFileResponse>> {
        return super.get<SupportFileResponse>();
    }

    async getSupportFiles(): Promise<AxiosResponse<SupportFileResponse[]>> {
        return super.get<SupportFileResponse[]>();
    }


}
