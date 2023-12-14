import { IResponse } from "@application/requests/interfaces/IResponse";
import {AxiosResponse} from "axios";
import ModelDataAggregator from "../models/DataAggregator";

export interface ArchiveAggregatorRequestProps{
    active: boolean,
}

export interface IDataAggregator {

    //to check if aggregator with such name already exists
    checkAggregatorName(): Promise<AxiosResponse<IResponse>>,

    //to add aggregator
    addAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>>,

    //to update aggregator
    updateAggregator(data: ModelDataAggregator): Promise<AxiosResponse<ModelDataAggregator>>,

    //to get one aggregator
    getAggregator(): Promise<AxiosResponse<ModelDataAggregator>>,

    //to get all aggregators
    getAllAggregators(): Promise<AxiosResponse<ModelDataAggregator[] | null>>,

    //to archive one aggregator
    archiveAggregator(): Promise<AxiosResponse<IResponse>>,

    //to unarchive one aggregator
    unarchiveAggregator(): Promise<AxiosResponse<IResponse>>,

    //to delete an argument
    deleteArgument(): Promise<AxiosResponse<IResponse>>,

}
