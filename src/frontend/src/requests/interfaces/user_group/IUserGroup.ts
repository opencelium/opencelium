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

import {AxiosResponse} from "axios";
import { IUserGroup } from "@interface/usergroup/IUserGroup";
import {IResponse} from "../application/IResponse";
import ModelUserGroupHateoas from "@model/user_group/UserGroupHateoas";
import ModelUserGroup from "@model/user_group/UserGroup";

export interface IUserGroupRequest{

    //to check if user group with such name already exists
    checkUserGroupName(): Promise<AxiosResponse<IResponse>>,

    //to get user group by id
    getUserGroupById(): Promise<AxiosResponse<IUserGroup>>,

    //to get all user groups of authorized user
    getAllUserGroups(): Promise<AxiosResponse<ModelUserGroupHateoas | null>>,

    //to add user group
    addUserGroup(userGroup: ModelUserGroup): Promise<AxiosResponse<ModelUserGroup>>,

    /*
    * TODO: check update on the server
    */
    //to update user group
    updateUserGroup(userGroup: ModelUserGroup): Promise<AxiosResponse<ModelUserGroup>>,

    //to delete user group by id
    deleteUserGroupById(): Promise<AxiosResponse<IUserGroup>>,

    //to delete user groups by id
    deleteUserGroupsById(userGroup: number[]): Promise<AxiosResponse<number[]>>,

    //to upload image of user group
    uploadUserGroupImage(data: FormData): Promise<AxiosResponse<any>>,

    //to delete image of user group
    deleteUserGroupImage(): Promise<AxiosResponse<any>>,
}