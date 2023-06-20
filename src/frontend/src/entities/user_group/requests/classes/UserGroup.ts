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
import {IUserGroup} from "../../interfaces/IUserGroup";
import {IUserGroupRequest} from "../../requests/interfaces/IUserGroup";
import ModelUserGroup from "../../requests/models/UserGroup";


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

    async getAllUserGroups(): Promise<AxiosResponse<ModelUserGroup[] | null>>{
        return super.get<ModelUserGroup[] | null>();
    }

    async addUserGroup(userGroup: ModelUserGroup): Promise<AxiosResponse<ModelUserGroup>>{
        return super.post<IUserGroup>(userGroup);
    }

    async updateUserGroup(userGroup: ModelUserGroup): Promise<AxiosResponse<ModelUserGroup>>{
        return super.put<ModelUserGroup>(userGroup);
    }

    async deleteUserGroupById(): Promise<AxiosResponse<IUserGroup>>{
        return super.delete<IUserGroup>();
    }

    async deleteUserGroupsById(userGroupIds: number[]): Promise<AxiosResponse<number[]>>{
        this.endpoint = '/list/delete';
        return super.put<number[]>({identifiers: userGroupIds});
    }

    async uploadUserGroupImage(data: FormData): Promise<AxiosResponse<any>>{
        this.url = 'storage/groupIcon';
        return super.post<FormData>(data);
    }

    async deleteUserGroupImage(): Promise<AxiosResponse<IUserGroup>>{
        return super.delete<IUserGroup>();
    }
}
