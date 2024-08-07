import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ILicenseRequest, {
    ActivateLicenseFileRequest,
    ActivateLicenseResponse, ActivateLicenseStringRequest, GenerateActivateRequestResponse,
} from "@entity/application/requests/interfaces/ILicenseRequest";
import {StatusResponse} from "@application/requests/interfaces/IApplication";

export default class LicenseRequest extends Request implements ILicenseRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'license', ...settings});
    }

    async generateActivateRequest (): Promise<AxiosResponse<GenerateActivateRequestResponse>> {
        return super.get<GenerateActivateRequestResponse>();
    }

    async activateFile(data: ActivateLicenseFileRequest): Promise<AxiosResponse<ActivateLicenseResponse>>{
        return super.post<ActivateLicenseResponse>(data);
    }

    async activateString(data: ActivateLicenseStringRequest): Promise<AxiosResponse<ActivateLicenseResponse>>{
        return super.post<ActivateLicenseResponse>(data);
    }

    async getStatus(): Promise<AxiosResponse<StatusResponse>> {
        this.endpoint = '/status;'
        return super.get<StatusResponse>();
    }

    async getActivationRequestStatus (): Promise<AxiosResponse<StatusResponse>> {
        this.endpoint = '/activation-request/status';
        return super.get<StatusResponse>();
    }
}
