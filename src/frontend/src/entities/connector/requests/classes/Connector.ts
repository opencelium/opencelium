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

import {AxiosRequestConfig, AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {CheckResponse, IResponse} from "@application/requests/interfaces/IResponse";
import {IConnectorRequest} from "../interfaces/IConnector";
import ModelConnectorPoust from "../models/ConnectorPoust";
import ModelConnector from "../models/Connector";


export class ConnectorRequest extends Request implements IConnectorRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'connector', ...settings});
    }

    async testRequestData(connector: ModelConnectorPoust): Promise<AxiosResponse<IResponse>>{
        return super.post<IResponse>(connector);
    }

    async checkConnectorTitle(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getConnectorById(settings?: AxiosRequestConfig): Promise<AxiosResponse<ModelConnector>>{
        return super.get<ModelConnector>(settings);
    }

    async getConnectorCredentials(settings?: AxiosRequestConfig): Promise<AxiosResponse<ModelConnector>>{
        return super.get<ModelConnector>(settings);
    }

    async getAllConnectors(): Promise<AxiosResponse<ModelConnector[] | null>>{
        return super.get<ModelConnector[] | null>();
    }

    async addConnector(connector: ModelConnectorPoust): Promise<AxiosResponse<ModelConnector>>{
        return super.post<ModelConnector>(connector);
    }

    async updateConnector(connector: ModelConnectorPoust): Promise<AxiosResponse<ModelConnector>>{
        return super.put<ModelConnector>(connector);
    }

    async updateRequestData(requestData: any, settings: AxiosRequestConfig): Promise<AxiosResponse<IResponse>>{
        return super.put<IResponse>(requestData, settings);
    }

    async deleteConnectorById(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }

    async deleteConnectorsById(connectorIds: number[]): Promise<AxiosResponse<number[]>>{
        this.endpoint = '/list/delete';
        return super.put<number[]>({identifiers: connectorIds});
    }

    async uploadConnectorImage(data: FormData): Promise<AxiosResponse<ModelConnector>>{
        this.url = 'storage/connector';
        return super.post<ModelConnector>(data);
    }

    async deleteConnectorImage(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }

    async checkMasterPassword(settings: AxiosRequestConfig): Promise<AxiosResponse<IResponse>>{
        this.endpoint = '/master-password/status'
        return super.get<IResponse>(settings);
    }

    async existMasterPassword(): Promise<AxiosResponse<CheckResponse>>{
        this.endpoint = '/master-password/status/exist'
        return super.get<CheckResponse>();
    }
}
