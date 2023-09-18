import {AxiosResponse} from "axios";
import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import ModelDataAggregator from "../models/DataAggregator";
import {IDataAggregator} from "../interfaces/IDataAggregator";
import {IResponse} from "@application/requests/interfaces/IResponse";

export class DataAggregatorRequest extends Request implements IDataAggregator {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'aggregator', ...settings});
    }

    async checkAggregatorName(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async addAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>> {
        return super.post<ModelDataAggregator>(data);
    }

    async updateAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>> {
        return super.put<ModelDataAggregator>(data);
    }

    async getAggregator(): Promise<AxiosResponse<ModelDataAggregator>>{
        return super.get<ModelDataAggregator>();
    }

    async getAllAggregators(): Promise<AxiosResponse<ModelDataAggregator[] | null>>{
        return super.get<ModelDataAggregator[] | null>();
    }

    async archiveAggregator(): Promise<AxiosResponse<IResponse>>{
        return super.put<IResponse>({active: true});
    }

    async unarchiveAggregator(): Promise<AxiosResponse<IResponse>>{
        return super.put<IResponse>({active: false});
    }

    async deleteArgument(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }

}
