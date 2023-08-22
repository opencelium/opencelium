import {AxiosResponse} from "axios";
import ModelDataAggregator from "../models/DataAggregator";

export interface AggregatorRequest {
    aggregator: ModelDataAggregator,
    connectionId: number,
}

export interface IDataAggregator {

    //to add aggregator for specific connection
    addAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>>,

    //to update aggregator for specific connection
    updateAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>>,

}
