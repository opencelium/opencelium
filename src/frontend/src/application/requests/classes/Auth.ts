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
import {IAuth, NoLicenseResponse} from "../interfaces/IAuth";
import {ICredentials} from "../../interfaces/IAuth";
import {IRequestSettings} from "../interfaces/IRequest";
import {LocalStorage} from "../../classes/LocalStorage";


export class AuthRequest extends Request implements IAuth{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: '', ...settings});
    }

    async login(credentials: ICredentials): Promise<AxiosResponse<IUser & NoLicenseResponse>>{
        this.url = 'login';
        return super.post<IUser & NoLicenseResponse>(credentials);
    }

    async uploadToken(token: string): Promise<AxiosResponse<IUser>> {
        this.url = 'upload-token';
        return super.post<IUser>({token});
    }

    logout():void{
        const storage = LocalStorage.getStorage(true);
        storage.remove('authUser');
    }
}
