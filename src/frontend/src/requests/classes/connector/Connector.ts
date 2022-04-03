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
import {IConnector} from "@interface/connector/IConnector";
import {IConnectorRequest} from "../../interfaces/connector/IConnector";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


export class ConnectorRequest extends Request implements IConnectorRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'connector', ...settings});
    }

    async testRequestData(connector: IConnector): Promise<AxiosResponse<IResponse>>{
        return super.post<IResponse>(this.backendMap(connector));
    }

    async checkConnectorTitle(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getConnectorById(): Promise<AxiosResponse<IConnector>>{
        return super.get<IConnector>();
    }

    async getAllConnectors(): Promise<AxiosResponse<IConnector[]>>{
        return super.get<IConnector[]>();
    }

    async addConnector(connector: IConnector): Promise<AxiosResponse<IConnector>>{
        return super.post<IConnector>(this.backendMap(connector));
    }

    async updateConnector(connector: IConnector): Promise<AxiosResponse<IConnector>>{
        return super.put<IConnector>(this.backendMap(connector));
    }

    async deleteConnectorById(): Promise<AxiosResponse<IConnector>>{
        return super.delete<IConnector>();
    }

    async deleteConnectorsById(connectorIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: connectorIds});
    }

    async uploadConnectorImage(data: FormData): Promise<AxiosResponse<IConnector>>{
        this.url = 'storage/connector';
        return super.post<IConnector>(data);
    }

    async deleteConnectorImage(): Promise<AxiosResponse<IConnector>>{
        return super.delete<IConnector>();
    }

    backendMap(connector: IConnector){
        let mappedConnector = {
            title: connector.title,
            description: connector.description,
            invoker: {name: connector.invokerSelect.value},
            requestData: connector.requestData,
            sslCert: connector.sslCert,
            timeout: connector.timeout,
        };
        if(connector.id !== 0){
            return {
                connectorId: connector.id,
                ...mappedConnector,
            }
        }
        return mappedConnector;
    }
}