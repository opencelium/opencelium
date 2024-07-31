import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ILicenseRequest, {
    ActivateLicenseFileRequest,
    ActivateLicenseResponse, ActivateLicenseStringRequest, GetStatusResponse
} from "@entity/application/requests/interfaces/ILicenseRequest";

export default class LicenseRequest extends Request implements ILicenseRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'license', ...settings});
    }

    async activateFile(data: ActivateLicenseFileRequest): Promise<AxiosResponse<ActivateLicenseResponse>>{
        return super.post<ActivateLicenseResponse>(data);
    }

    async activateString(data: ActivateLicenseStringRequest): Promise<AxiosResponse<ActivateLicenseResponse>>{
        return super.post<ActivateLicenseResponse>(data);
    }

    async getStatus(): Promise<AxiosResponse<GetStatusResponse>>{
        return super.get<GetStatusResponse>();
    }
}
