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
import {IConnection} from "../../interfaces/IConnection";
import {IConnectionRequest} from "../interfaces/IConnection";
import category from "@entity/category/translations/interpolations/category";


export class ConnectionRequest extends Request implements IConnectionRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'connection', ...settings});
    }

    async checkConnectionTitle(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getConnectionById(): Promise<AxiosResponse<IConnection>>{
        return super.get<IConnection>();
    }

    async getAllConnections(): Promise<AxiosResponse<IConnection[]>>{
        this.endpoint = '/all';
        return super.get<IConnection[]>();
    }

    async getAllMetaConnections(): Promise<AxiosResponse<IConnection[]>>{
        this.endpoint = '/all/meta';
        return super.get<IConnection[]>();
    }

    async addConnection(connection: IConnection): Promise<AxiosResponse<IConnection>>{
        return super.post<IConnection>(this.backendMap(connection));
    }

    async updateConnection(connection: IConnection): Promise<AxiosResponse<IConnection>>{
        return super.put<IConnection>(this.backendMap(connection));
    }

    async deleteConnectionById(): Promise<AxiosResponse<IConnection>>{
        return super.delete<IConnection>();
    }

    async deleteConnectionsById(connectionIds: number[]): Promise<AxiosResponse<number[]>>{
        this.endpoint = '/list/delete';
        return super.put<number[]>({identifiers: connectionIds});
    }

    backendMap(connection: IConnection){
        let mappedConnection: any = {
            title: connection.title,
            description: connection.description,
            fromConnector: {...connection.fromConnector, invoker: {name: connection.fromConnector.invoker.name}},
            toConnector: {...connection.toConnector, invoker: {name: connection.toConnector.invoker.name}},
            fieldBinding: connection.fieldBinding,
        };
        if(connection.categoryId) {
            mappedConnection.categoryId = connection.categoryId;
        }
        if(connection.id !== 0){
            return {
                connectionId: connection.id,
                ...mappedConnection,
            }
        }
        return mappedConnection;
    }
}
