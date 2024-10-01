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

import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import LdapConfigModel from "@entity/ldap/requests/models/LdapConfigModel";

export interface GenerateQRCodeResponse {
    secretKey: string,
    qr: string,
}

export interface ToggleTotpRequest {
    code: string,
}

export interface LoginTOTPRequest {
    username: string,
    password: string,
}

export interface LoginTOTPResponse {
    session_id: string,
}

export interface ValidateTOTPRequest {
    session_id: string,
    code: string,
}

export default interface ITotpRequest {

    generateQRCode(): Promise<AxiosResponse<GenerateQRCodeResponse>>,

    toggleTotp(data: ToggleTotpRequest): Promise<AxiosResponse<IResponse>>,

    login(data: LoginTOTPRequest): Promise<AxiosResponse<LoginTOTPResponse>>,

    validate(data: ValidateTOTPRequest): Promise<AxiosResponse<any>>,
}
