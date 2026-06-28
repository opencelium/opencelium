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
import Request from "@entity/application/requests/classes/Request";
import IUser from "@entity/user/interfaces/IUser";
import {IAuth} from "../interfaces/IAuth";
import {ICredentials} from "../../interfaces/IAuth";
import {IRequestSettings} from "../interfaces/IRequest";
import {LocalStorage} from "../../classes/LocalStorage";
import {LoginTOTPResponse} from "@entity/totp/requests/interfaces/ITotp";


export interface SimpleMessageResponse {
    message: string;
}

export interface ErrorResponse {
    message?: string;
    error?: string;
}

export class AuthRequest extends Request implements IAuth{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: '', ...settings});
    }

    async login(credentials: ICredentials): Promise<AxiosResponse<IUser & LoginTOTPResponse>>{
        this.url = 'login';
        return super.post<IUser & LoginTOTPResponse>(credentials);
    }

    async getOidcInfo(): Promise<AxiosResponse<{enabled: boolean, buttonText: string}>>{
        this.url = 'oidc/info';
        this.hasAuthToken = false;

        return super.get<{enabled: boolean, buttonText: string}>();
    }

    async exchangeOidcCode(code: string): Promise<AxiosResponse<IUser & LoginTOTPResponse>>{
        this.url = 'oidc/token';
        this.hasAuthToken = false;

        return super.post<IUser & LoginTOTPResponse>({code});
    }

    async forgotPassword(email: string): Promise<AxiosResponse<SimpleMessageResponse>>{
        this.url = 'auth/forgot-password';
        this.hasAuthToken = false;

        return super.post<SimpleMessageResponse>({
            email,
        });
    }

    async resetPassword(
        token: string,
        newPassword: string,
        confirmPassword: string
    ): Promise<AxiosResponse<SimpleMessageResponse>>{

        this.url = 'auth/reset-password';
        this.hasAuthToken = false;

        return super.post<SimpleMessageResponse>({
            token,
            newPassword,
            confirmPassword,
        });
    }

    logout():void{
        const storage = LocalStorage.getStorage(true);
        storage.remove('authUser');
    }
}
