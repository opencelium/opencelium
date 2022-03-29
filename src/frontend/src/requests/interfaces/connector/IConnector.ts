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