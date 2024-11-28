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

import Request from "@entity/application/requests/classes/Request";
import {AxiosResponse} from "axios";
import {
    InstallationInfo,
    IUpdateAssistantRequest,
    VersionProps
} from "@application/requests/interfaces/IUpdateAssistant";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";


export class UpdateAssistantRequest extends Request implements IUpdateAssistantRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'assistant/oc', ...settings});
    }

    async getInstallationInfo(): Promise<AxiosResponse<InstallationInfo>>{
        this.endpoint = '/installation';
        return super.get<InstallationInfo>();
    }

    async getChangelogInfo(): Promise<AxiosResponse<string>>{
        return super.get<string>();
    }

    async uploadOnlineVersion(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async downloadOnlineVersion(): Promise<AxiosResponse<VersionProps>>{
        return super.get<VersionProps>();
    }

    async getOnlineUpdates(): Promise<AxiosResponse<VersionProps[]>>{
        this.endpoint = '/online/version/all';
        return super.get<VersionProps[]>();
    }

    async getOfflineUpdates(): Promise<AxiosResponse<VersionProps[]>>{
        this.endpoint = '/offline/version/all';
        return super.get<VersionProps[]>();
    }

    async uploadApplicationFile(application: FormData, onUploadProgress?: (progressEvent: any) => void): Promise<AxiosResponse<VersionProps>>{
        this.url = 'assistant/zipfile';
        return super.post<VersionProps>(application, {onUploadProgress});
    }

    async deleteApplicationFile(): Promise<AxiosResponse<IResponse>>{
        this.url = 'assistant/zipfile';
        return super.delete<IResponse>();
    }

    async checkApplicationBeforeUpdate(): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/restart/file/exists';
        return super.get<IResponse>();
    }

    async updateApplication(data: any): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/migrate';
        return super.post<IResponse>(data);
    }
}
