import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import {StatusResponse} from "@application/requests/interfaces/IApplication";
import ILicenseRequest, {
    ActivateLicenseResponse, ActivateLicenseStringRequest,
    GenerateActivateRequestResponse, GetActivationRequestStatusResponse
} from "@entity/license_management/requests/interfaces/ILicenseRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {LicenseListItem} from "@entity/license_management/requests/models/LicenseModel";

export default class LicenseRequest extends Request implements ILicenseRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'license', ...settings});
    }

    async getLicenseList(): Promise<AxiosResponse<LicenseListItem[]>>{
        this.url = 'subs/all';
        return super.get<LicenseListItem[]>();
    }

    async generateActivateRequest (): Promise<AxiosResponse<GenerateActivateRequestResponse>> {
        this.url = 'subs';
        this.endpoint = '/activation/request/generate';
        return super.get<GenerateActivateRequestResponse>();
    }

    async activateFile(data: FormData): Promise<AxiosResponse<ActivateLicenseResponse>>{
        this.url = 'subs';
        this.endpoint = '/activate/license';
        return super.post<ActivateLicenseResponse>(data);
    }

    async activateString(data: ActivateLicenseStringRequest): Promise<AxiosResponse<ActivateLicenseResponse>>{
        return super.post<ActivateLicenseResponse>(data);
    }

    async getStatus(): Promise<AxiosResponse<StatusResponse>> {
        this.url = 'subs';
        this.endpoint = '/connection/check'
        return super.get<StatusResponse>();
    }

    async getActivationRequestStatus (): Promise<AxiosResponse<GetActivationRequestStatusResponse>> {
        this.endpoint = '/activation-request/status';
        return super.get<GetActivationRequestStatusResponse>();
    }

    async deleteLicense (): Promise<AxiosResponse<IResponse>> {
        this.url = 'subs';
        return super.delete<IResponse>();
    }

    async activateFreeLicense (): Promise<AxiosResponse<IResponse>> {
        this.url = 'subs/free/activate';
        return super.get<IResponse>();
    }
}
