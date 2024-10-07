/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import Request from "@entity/application/requests/classes/Request";
import {AxiosResponse} from "axios";
import ITotpRequest, {
    GenerateQRCodeResponse, IsTotpExistResponse,
    LoginTOTPRequest, LoginTOTPResponse,
    ToggleTotpRequest,
    ValidateTOTPRequest
} from "../interfaces/ITotp";
import {IResponse} from "@application/requests/interfaces/IResponse";

export default class TotpRequest extends Request implements ITotpRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'user', ...settings});
    }

    async generateQRCode(): Promise<AxiosResponse<GenerateQRCodeResponse>>{
        this.endpoint = '/totp-qr';
        return super.get<GenerateQRCodeResponse>();
    }

    async toggleTotp(data: ToggleTotpRequest): Promise<AxiosResponse<IResponse>> {
        return super.post<IResponse>(data);
    }

    async login(data: LoginTOTPRequest): Promise<AxiosResponse<LoginTOTPResponse>> {
        this.url = 'login';
        return super.post<LoginTOTPResponse>(data);
    }

    async validate(data: ValidateTOTPRequest): Promise<AxiosResponse<any>> {
        this.endpoint = '/totp-validate';
        return super.post<any>(data);
    }

    async isExist(): Promise<AxiosResponse<IsTotpExistResponse>> {
        this.endpoint = '/totp-qr/exists';
        return super.get<IsTotpExistResponse>();
    }
}
