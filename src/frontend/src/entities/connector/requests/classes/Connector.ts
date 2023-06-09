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
import {IConnectorRequest} from "../interfaces/IConnector";
import ModelConnectorPoust from "../models/ConnectorPoust";
import ModelConnector from "../models/Connector";
import ModelConnectorHateoas from "../models/ConnectorHateoas";


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

    async getConnectorById(): Promise<AxiosResponse<ModelConnector>>{
        return super.get<ModelConnector>();
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

    async deleteConnectorById(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }

    async deleteConnectorsById(connectorIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: connectorIds});
    }

    async uploadConnectorImage(data: FormData): Promise<AxiosResponse<ModelConnector>>{
        this.url = 'storage/connector';
        return super.post<ModelConnector>(data);
    }

    async deleteConnectorImage(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }
}