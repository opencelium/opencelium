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
import {IConnectorRequest} from "../../interfaces/connector/IConnector";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";
import ModelConnectorPoust from "@model/connector/ConnectorPoust";
import ModelConnector from "@model/connector/Connector";
import ModelConnectorHateoas from "@model/connector/ConnectorHateoas";


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

    async getAllConnectors(): Promise<AxiosResponse<ModelConnectorHateoas | null>>{
        return super.get<ModelConnectorHateoas | null>();
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