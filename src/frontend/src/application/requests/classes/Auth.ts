/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {Request} from "./Request";
import {AxiosResponse} from "axios";
import { IAuth } from "../interfaces/IAuth";
import {ICredentials} from "../../interfaces/IAuth";
import {IRequestSettings} from "../interfaces/IRequest";
import {LocalStorage} from "../../classes/LocalStorage";

//TODO think how to extract User and UserDetail from application
import IUserDetail from "@entity/user/interfaces/IUserDetail";
import UserDetailRequest from "@entity/user/requests/classes/UserDetailRequest";
import IUser from "@entity/user/interfaces/IUser";


export class AuthRequest extends Request implements IAuth{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: '', ...settings});
    }

    async updateAuthUserDetail(userDetail: Partial<IUserDetail>): Promise<AxiosResponse<IUserDetail>>{
        return super.put<IUserDetail>(UserDetailRequest.backendMap(userDetail));
    }

    async login(credentials: ICredentials): Promise<AxiosResponse<IUser>>{
        this.url = 'login';
        return super.post<IUser>(credentials);
    }

    logout():void{
        const storage = LocalStorage.getStorage(true);
        storage.remove('authUser');
    }
}