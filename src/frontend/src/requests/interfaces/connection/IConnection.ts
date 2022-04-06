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

import {AxiosResponse} from "axios";
import { IConnection } from "@interface/connection/IConnection";
import {IResponse} from "../application/IResponse";

export interface IConnectionRequest{

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