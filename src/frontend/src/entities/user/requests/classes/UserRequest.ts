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
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import IUserRequest from "../interfaces/IUserRequest";
import ModelUser from "../models/User";
import ModelUserPoust from "../models/UserPoust";
import ModelUserHateoas from "../models/UserHateoas";


export default class UserRequest extends Request implements IUserRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'user', ...settings});
    }

    async checkUserEmail(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getUserById(): Promise<AxiosResponse<ModelUser>>{
        return super.get<ModelUser>();
    }

    async getAllUsers(): Promise<AxiosResponse<ModelUser[] | null>>{
        return super.get<ModelUser[] | null>();
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
}