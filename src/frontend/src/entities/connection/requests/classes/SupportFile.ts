import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ISupportFileRequest, {
    DeleteSupportFilesRequest,
    SupportFileResponse
} from "@root/requests/interfaces/ISupportFile";
import {IResponse} from "@application/requests/interfaces/IResponse";


export class SupportFileRequest extends Request implements ISupportFileRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'connection/support-file', ...settings});
    }

    async downloadSupportFile(): Promise<AxiosResponse<Blob>> {
        this.url = '';
        return super.get<Blob>({responseType: 'blob'});
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

    async deleteSupportFile(): Promise<AxiosResponse<IResponse>> {
        return super.delete<IResponse>();
    }

    async deleteSupportFiles(data: DeleteSupportFilesRequest): Promise<AxiosResponse<IResponse>> {
        this.endpoint = '/delete/list';
        return super.put<IResponse>(data);
    }


}
