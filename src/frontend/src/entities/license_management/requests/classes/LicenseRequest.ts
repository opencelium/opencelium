import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import {StatusResponse} from "@application/requests/interfaces/IApplication";
import ILicenseRequest, {
    ActivateLicenseFileRequest, ActivateLicenseResponse, ActivateLicenseStringRequest,
    GenerateActivateRequestResponse, GetActivationRequestStatusResponse
} from "@entity/license_management/requests/interfaces/ILicenseRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";

export default class LicenseRequest extends Request implements ILicenseRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'license', ...settings});
    }

    async generateActivateRequest (): Promise<AxiosResponse<GenerateActivateRequestResponse>> {
        this.url = 'subs';
        return super.get<GenerateActivateRequestResponse>();
    }

    async activateFile(data: ActivateLicenseFileRequest): Promise<AxiosResponse<ActivateLicenseResponse>>{
        return super.post<ActivateLicenseResponse>(data);
    }

    async activateString(data: ActivateLicenseStringRequest): Promise<AxiosResponse<ActivateLicenseResponse>>{
        return super.post<ActivateLicenseResponse>(data);
    }

    async getStatus(): Promise<AxiosResponse<StatusResponse>> {
        this.endpoint = '/status'
        return super.get<StatusResponse>();
    }

    async getActivationRequestStatus (): Promise<AxiosResponse<GetActivationRequestStatusResponse>> {
        this.endpoint = '/activation-request/status';
        return super.get<GetActivationRequestStatusResponse>();
    }

    async deleteLicense (): Promise<AxiosResponse<IResponse>> {
        return super.delete<IResponse>();
    }
}
