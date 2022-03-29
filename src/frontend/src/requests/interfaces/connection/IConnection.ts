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