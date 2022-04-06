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
import { IConnector } from "@interface/connector/IConnector";
import {IResponse} from "../application/IResponse";

export interface IConnectorRequest{
    //to test validity of request data
    testRequestData(connector: IConnector): Promise<AxiosResponse<IResponse>>,

    //to check if connector with such title already exists
    checkConnectorTitle(): Promise<AxiosResponse<IResponse>>,

    //to get connector by id
    getConnectorById(): Promise<AxiosResponse<IConnector>>,

    //to get all connectors of authorized user
    getAllConnectors(): Promise<AxiosResponse<IConnector[]>>,

    //to add connector
    addConnector(connector: IConnector): Promise<AxiosResponse<IConnector>>,

    //to update connector
    updateConnector(connector: IConnector): Promise<AxiosResponse<IConnector>>,

    //to delete connector by id
    deleteConnectorById(): Promise<AxiosResponse<IConnector>>,

    //to delete connectors by id
    deleteConnectorsById(connector: number[]): Promise<AxiosResponse<number[]>>,

    //to upload image of connector
    uploadConnectorImage(data: FormData): Promise<AxiosResponse<IConnector>>,

    /*
    * TODO: do not exist such method on the server
    */
    //to delete image of connector
    deleteConnectorImage(): Promise<AxiosResponse<any>>,
}