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
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {IConnection} from "../../interfaces/IConnection";
import {IConnectionRequest} from "../interfaces/IConnection";


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
        return super.get<IConnection[]>();
    }

    async getAllMetaConnections(): Promise<AxiosResponse<IConnection[]>>{
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
        return super.delete<number[]>({data: connectionIds});
    }

    backendMap(connection: IConnection){
        let mappedConnection = {
            title: connection.title,
            description: connection.description,
            fromConnector: connection.fromConnector,
            toConnector: connection.toConnector,
            fieldBinding: connection.fieldBinding,
        };
        if(connection.id !== 0){
            return {
                connectionId: connection.id,
                ...mappedConnection,
            }
        }
        return mappedConnection;
    }
}