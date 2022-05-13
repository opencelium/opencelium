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

import {IForm} from "@application/interfaces/core";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import { IUserGroup } from "@entity/user_group/interfaces/IUserGroup";
import IUserDetail from "./IUserDetail";
import ModelUserPoust from "../requests/models/UserPoust";
import IAuthUser from "@entity/user/interfaces/IAuthUser";

export interface IUserSwitch{
}

export interface IUserFile{
}
export interface IUserTextarea{
    userGroupDescription: string;
}

export interface IUserSelect{
    userGroupSelect: OptionProps;
}

export interface IUserRadios{
}

export interface IUserText{
    email: string;
    password: string;
    repeatPassword: string;
}


export interface IUserForm extends IUserText, IUserSelect, IUserRadios, IUserFile, IUserSwitch, IForm<IUserText, IUserSelect, IUserRadios, IUserFile, IUserTextarea, IUserSwitch>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
    uploadImage: () => boolean;
    deleteImage: () => boolean;
    checkEmail: () => boolean;
}
export default interface IUser extends IUserForm{
    id?: number;
    userId?: number;
    userDetail: Partial<IUserDetail>,
    userGroup: IUserGroup,
    getFullName?: () => string,
    getPoustModel?: (isForApiRequest?: boolean) => ModelUserPoust,
}
