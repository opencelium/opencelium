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
import {IUser} from "@interface/user/IUser";
import {IUserRequest} from "../../interfaces/user/IUser";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


export class UserRequest extends Request implements IUserRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'user', ...settings});
    }

    async checkUserEmail(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getUserById(): Promise<AxiosResponse<IUser>>{
        return super.get<IUser>();
    }

    async getAllUsers(): Promise<AxiosResponse<IUser[]>>{
        return super.get<IUser[]>();
    }

    async addUser(user: IUser): Promise<AxiosResponse<IUser>>{
        return super.post<IUser>(UserRequest.backendMap(user));
    }

    async updateUser(user: IUser): Promise<AxiosResponse<IUser>>{
        return super.put<IUser>(UserRequest.backendMap(user));
    }

    async deleteUserById(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }

    async deleteUsersById(userIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: userIds});
    }

    async uploadUserImage(data: FormData): Promise<AxiosResponse<any>>{
        this.url = 'storage/profilePicture';
        return super.post<FormData>(data);
    }

    async deleteUserImage(): Promise<AxiosResponse<any>>{
        return super.delete<any>();
    }

    static backendMap(user: IUser){
        let mappedUser = {
            email: user.email,
            password: user.password,
            repeatPassword: user.repeatPassword,
            userGroup: user.userGroupSelect.value,
            userDetail: {
                userTitle: user.userDetail.userTitle,
                surname: user.userDetail.surname,
                name: user.userDetail.name,
                department: user.userDetail.department,
                organization: user.userDetail.organization,
                phoneNumber: user.userDetail.phoneNumber,
            }
        };
        if(user.id !== 0){
            return {
                id: user.id,
                ...mappedUser,
            }
        }
        return mappedUser;
    }
}