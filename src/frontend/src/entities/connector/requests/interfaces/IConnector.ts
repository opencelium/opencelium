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
import {IResponse} from "@application/requests/interfaces/IResponse";
import ModelConnectorPoust from "../models/ConnectorPoust";
import ModelConnector from "../models/Connector";

export interface IConnectorRequest{
    //to test validity of request data
    testRequestData(connector: ModelConnectorPoust): Promise<AxiosResponse<IResponse>>,

    //to check if connector with such title already exists
    checkConnectorTitle(): Promise<AxiosResponse<IResponse>>,

    //to get connector by id
    getConnectorById(settings?: AxiosRequestConfig): Promise<AxiosResponse<ModelConnector>>,

    //to get connector credentials
    getConnectorCredentials(settings?: AxiosRequestConfig): Promise<AxiosResponse<ModelConnector>>,

    //to get all connectors of authorized user
    getAllConnectors(): Promise<AxiosResponse<ModelConnector[] | null>>,

    //to add connector
    addConnector(connector: ModelConnectorPoust): Promise<AxiosResponse<ModelConnector>>,

    //to update connector
    updateConnector(connector: ModelConnectorPoust): Promise<AxiosResponse<ModelConnector>>,

    //to update request data
    updateRequestData(requestData: any, settings: AxiosRequestConfig): Promise<AxiosResponse<IResponse>>,

    //to delete connector by id
    deleteConnectorById(): Promise<AxiosResponse<IResponse>>,

    //to delete connectors by id
    deleteConnectorsById(connector: number[]): Promise<AxiosResponse<number[]>>,

    //to upload image of connector
    uploadConnectorImage(data: FormData): Promise<AxiosResponse<ModelConnector>>,

    /*
    * TODO: do not exist such method on the server
    */
    //to delete image of connector
    deleteConnectorImage(): Promise<AxiosResponse<any>>,

    //to check master password
    checkMasterPassword(settings: AxiosRequestConfig): Promise<AxiosResponse<IResponse>>,
}
