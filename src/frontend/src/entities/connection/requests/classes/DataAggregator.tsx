import Request from "@entity/application/requests/classes/Request";
import {IConnectionRequest} from "@root/requests/interfaces/IConnection";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {IDataAggregator} from "../interfaces/IDataAggregator";
import ModelDataAggregator from "@root/requests/models/DataAggregator";

export class DataAggregatorRequest extends Request implements IDataAggregator {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'connection', ...settings});
    }

    async addAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>> {
        return super.post<ModelDataAggregator>(data);
    }

    async updateAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>> {
        return super.put<ModelDataAggregator>(data);
    }

}
