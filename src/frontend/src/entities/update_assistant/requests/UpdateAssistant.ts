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
import {IUpdateAssistantRequest, OnlineUpdateProps, OfflineUpdateProps} from "@application/requests/interfaces/IUpdateAssistant";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {onlineApiServerOpenCeliumUrl} from "@entity/application/requests/classes/url";
import {generateSignature} from "@application/utils/utils";


export class UpdateAssistantRequest extends Request implements IUpdateAssistantRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'assistant/oc', ...settings});
    }

    async uploadOnlineVersion(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getOnlineUpdates(): Promise<AxiosResponse<OnlineUpdateProps[]>>{
        this.endpoint = '/online/version/all';
        return super.get<OnlineUpdateProps[]>();
    }

    async getOfflineUpdates(): Promise<AxiosResponse<OfflineUpdateProps[]>>{
        this.endpoint = '/offline/versions';
        return super.get<OfflineUpdateProps[]>();
    }

    async uploadApplicationFile(application: FormData): Promise<AxiosResponse<IResponse>>{
        this.url = '/assistant/zipfile';
        return super.post<IResponse>(application);
    }

    async deleteApplicationFile(): Promise<AxiosResponse<IResponse>>{
        this.url = '/assistant/zipfile';
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