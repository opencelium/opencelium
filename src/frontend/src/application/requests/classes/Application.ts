/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {IRequestSettings} from "../interfaces/IRequest";
import {
    ResourcesProps,
    ApplicationVersionResponseProps,
    GlobalSearchResponseProps,
    IApplicationRequest, RemoteApiRequestProps, RemoteApiResponseProps
} from "../interfaces/IApplication";
import {errorTicketUrl} from "@entity/application/requests/classes/url";
import {ITicket} from "../../interfaces/ITicket";
import {IResponse} from "../interfaces/IResponse";
import { IComponent } from "../../interfaces/IApplication";


export class ApplicationRequest extends Request implements IApplicationRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: '', ...settings});
    }

    async remoteApiRequest(data: RemoteApiRequestProps): Promise<AxiosResponse<RemoteApiResponseProps>>{
        this.url = 'connection/remoteapi/test';
        return super.post<RemoteApiResponseProps>(data);
    }

    async addTicket(ticket: ITicket): Promise<AxiosResponse<IResponse>>{
        this.url = errorTicketUrl;
        return super.post<IResponse>(ticket);
    }

    async getVersion(): Promise<AxiosResponse<ApplicationVersionResponseProps>>{
        this.url = 'assistant/oc/version';
        return super.get<ApplicationVersionResponseProps>();
    }

    async getResources(): Promise<AxiosResponse<ResourcesProps>>{
        this.url = 'assistant/subscription/repo/diff/files'
        return super.get<ResourcesProps>();
    }

    async getGlobalSearchData(): Promise<AxiosResponse<GlobalSearchResponseProps>>{
        this.url = 'search';
        return super.get<GlobalSearchResponseProps>();
    }

    async getAllComponents(): Promise<AxiosResponse<IComponent[]>>{
        this.url = 'component/all';
        return super.get<IComponent[]>();
    }

    async updateResources(): Promise<AxiosResponse<IResponse>>{
        this.url = 'assistant/subscription/repo/update'
        return super.get<IResponse>();
    }

    async openExternalUrl(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }
}