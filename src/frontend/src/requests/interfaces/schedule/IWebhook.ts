import {AxiosResponse} from "axios";
import { IWebhook } from "@interface/schedule/IWebhook";
import {IResponse} from "../application/IResponse";

export interface IWebhookRequest{

    //to get webhook by user id and schedule id
    getWebhookByUserIdAndScheduleId(): Promise<AxiosResponse<IWebhook>>,

    //to delete webhook by id
    deleteWebhookById(): Promise<AxiosResponse<IResponse>>,
}