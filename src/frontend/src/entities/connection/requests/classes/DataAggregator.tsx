import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import ModelDataAggregator from "../models/DataAggregator";
import {IDataAggregator} from "../interfaces/IDataAggregator";

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
