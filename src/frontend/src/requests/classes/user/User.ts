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

import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IUserRequest} from "../../interfaces/user/IUser";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";
import ModelUser from "@model/user/User";
import ModelUserPoust from "@model/user/UserPoust";


export class UserRequest extends Request implements IUserRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'user', ...settings});
    }

    async checkUserEmail(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getUserById(): Promise<AxiosResponse<ModelUser>>{
        return super.get<ModelUser>();
    }

    async getAllUsers(): Promise<AxiosResponse<ModelUser[]>>{
        return super.get<ModelUser[]>();
    }

    async addUser(user: ModelUserPoust): Promise<AxiosResponse<ModelUser>>{
        return super.post<ModelUser>(user);
    }

    async updateUser(user: ModelUserPoust): Promise<AxiosResponse<ModelUser>>{
        return super.put<ModelUser>(user);
    }

    async deleteUserById(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }

    async deleteUsersById(userIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: userIds});
    }

    async uploadUserImage(data: FormData): Promise<AxiosResponse<ModelUser>>{
        this.url = 'storage/profilePicture';
        return super.post<ModelUser>(data);
    }

    async deleteUserImage(): Promise<AxiosResponse<IResponse>>{
        return super.delete<any>();
    }
}