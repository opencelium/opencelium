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
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import {IUserGroupRequest} from "../../interfaces/user_group/IUserGroup";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


export class UserGroupRequest extends Request implements IUserGroupRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'role', ...settings});
    }

    async checkUserGroupName(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getUserGroupById(): Promise<AxiosResponse<IUserGroup>>{
        return super.get<IUserGroup>();
    }

    async getAllUserGroups(): Promise<AxiosResponse<IUserGroup[]>>{
        return super.get<IUserGroup[]>();
    }

    async addUserGroup(userGroup: IUserGroup): Promise<AxiosResponse<IUserGroup>>{
        return super.post<IUserGroup>(this.backendMap(userGroup));
    }

    async updateUserGroup(userGroup: IUserGroup): Promise<AxiosResponse<IUserGroup>>{
        return super.put<IUserGroup>(this.backendMap(userGroup));
    }

    async deleteUserGroupById(): Promise<AxiosResponse<IUserGroup>>{
        return super.delete<IUserGroup>();
    }

    async deleteUserGroupsById(userGroupIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: userGroupIds});
    }

    async uploadUserGroupImage(data: FormData): Promise<AxiosResponse<any>>{
        this.url = 'storage/groupIcon';
        return super.post<FormData>(data);
    }

    async deleteUserGroupImage(): Promise<AxiosResponse<IUserGroup>>{
        return super.delete<IUserGroup>();
    }

    backendMap(userGroup: IUserGroup){
        let mappedUserGroup = {
            name: userGroup.name,
            description: userGroup.description,
            components: userGroup.componentsSelect.map(component => {return {componentId: component.value, permissions: userGroup.permissions[component.label]}}),
        };
        if(userGroup.id !== 0){
            return {
                id: userGroup.id,
                ...mappedUserGroup,
            }
        }
        return mappedUserGroup;
    }
}