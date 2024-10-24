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
import ModelUser from "../models/User";
import ModelUserPoust from "../models/UserPoust";

export interface DeleteUsersByIdRequestProps{
    identifiers: number[],
}

export default interface IUserRequest{

    //to check if user with such email already exists
    checkUserEmail(): Promise<AxiosResponse<IResponse>>,

    //to get user by id
    getUserById(): Promise<AxiosResponse<ModelUser>>,

    //to get all users of authorized user
    getAllUsers(): Promise<AxiosResponse<ModelUser[] | null>>,

    //to add user
    addUser(user: ModelUserPoust): Promise<AxiosResponse<ModelUser>>,

    //to update user
    updateUser(user: ModelUserPoust): Promise<AxiosResponse<ModelUser>>,

    //to delete user by id
    deleteUserById(): Promise<AxiosResponse<IResponse>>,

    //to delete users by id
    deleteUsersById(args: DeleteUsersByIdRequestProps): Promise<AxiosResponse<IResponse>>,

    //to upload image of user
    uploadUserImage(data: FormData): Promise<AxiosResponse<ModelUser>>,
}
