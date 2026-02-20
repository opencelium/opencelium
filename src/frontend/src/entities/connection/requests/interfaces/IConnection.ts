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
import {IResponse} from "@application/requests/interfaces/IResponse";
import { IConnection } from "../../interfaces/IConnection";
import {RuleBaseModel} from "@root/requests/models/Rule";
import {MetaConnectionModel} from "@root/requests/models/Connection";

export interface GetConnectionWebhooksResponse {
    name: string,
    type: string,
}

export interface IConnectionRequest {

    //to get connections by invoker name
    getMetaConnectionsByInvokerName(invokerName: string): Promise<AxiosResponse<MetaConnectionModel[]>>,

    //to generate support file
    generateSupportFile(rule: RuleBaseModel[]): Promise<AxiosResponse<IResponse>>,

    //to get webhooks params of the connection
    getConnectionWebhooks(): Promise<AxiosResponse<GetConnectionWebhooksResponse[]>>,

    //to check if connection with such title already exists
    checkConnectionTitle(): Promise<AxiosResponse<IResponse>>,

    //to get connection by id
    getConnectionById(): Promise<AxiosResponse<IConnection>>,

    //to get all connections of authorized user
    getAllConnections(): Promise<AxiosResponse<IConnection[]>>,

    //to get all metadata of connections of authorized user
    getAllMetaConnections(): Promise<AxiosResponse<IConnection[]>>,

    //to add connection
    addConnection(connection: IConnection): Promise<AxiosResponse<IConnection>>,

    //to update connection
    updateConnection(connection: IConnection): Promise<AxiosResponse<IConnection>>,

    //to delete connection by id
    deleteConnectionById(): Promise<AxiosResponse<IConnection>>,

    //to delete connections by id
    deleteConnectionsById(connection: number[]): Promise<AxiosResponse<number[]>>,
}

export interface ConnectionVersionItem {
    connectionId: number;
    title: string;
    snapshotId: string;
    createdAt: number;
    comment?: string;
    current?: boolean;
}
