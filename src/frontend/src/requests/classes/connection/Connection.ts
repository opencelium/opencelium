import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IConnection} from "@interface/connection/IConnection";
import {IConnectionRequest} from "../../interfaces/connection/IConnection";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


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