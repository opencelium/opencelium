import { IResponse } from "@application/requests/interfaces/IResponse";
import {AxiosResponse} from "axios";
import ModelDataAggregator from "../models/DataAggregator";


export interface IDataAggregator {

    //to add aggregator
    addAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>>,

    //to update aggregator
    updateAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>>,

    //to get one aggregator
    getAggregator(): Promise<AxiosResponse<ModelDataAggregator>>,

    //to get all aggregators
    getAllAggregators(): Promise<AxiosResponse<ModelDataAggregator[] | null>>,

    //to delete one aggregator
    deleteAggregator(): Promise<AxiosResponse<IResponse>>,

}
