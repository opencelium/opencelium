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

import {IForm} from "@interface/application/core";
import {
    ComponentProps,
    PermissionProps,
    PermissionsProps
} from "@molecule/form_section/permissions/interfaces";
import {UserGroupState} from "@slice/UserGroupSlice";
import {OptionProps} from "@atom/input/select/interfaces";
import ModelUserPoust from "@model/user/UserPoust";
import ModelUserGroup from "@model/user_group/UserGroup";


export interface IUserGroupFile{
    iconFile: FileList;
}
export interface IUserGroupTextarea{
    description: string;
}

export interface IUserGroupSelect{
    componentsSelect: OptionProps[];
}

export interface IUserGroupText{
    name: string;
}


export interface IUserGroupForm extends IUserGroupText, IUserGroupTextarea, IUserGroupSelect, IUserGroupFile, IForm<IUserGroupText, IUserGroupSelect, {}, IUserGroupFile, IUserGroupTextarea, {}>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
    reduxState?: UserGroupState;
}
export interface IUserGroup extends IUserGroupForm{
    id?: number;
    userGroupId?: number,
    groupId?: number,
    components: ComponentProps[],
    permissions: PermissionProps,
    getPermissionComponent: (props?: PermissionsProps) => {},
    shouldDeleteIcon?: boolean,
    icon?: string,
    getPoustModel?: () => ModelUserGroup,
}
