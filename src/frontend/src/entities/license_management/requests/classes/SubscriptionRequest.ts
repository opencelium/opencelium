import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ISubscriptionRequest from "@entity/license_management/requests/interfaces/ISubscriptionRequest";
import SubscriptionModel, {
    OperationUsageDetailModel,
    OperationUsageEntryModel
} from "@entity/license_management/requests/models/SubscriptionModel";
import {PageResponse} from "@application/requests/interfaces/IResponse";

export default class SubscriptionRequest extends Request implements ISubscriptionRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'subs', ...settings});
    }

    async getCurrent(): Promise<AxiosResponse<SubscriptionModel>>{
        this.endpoint = '/active';
        return super.get<SubscriptionModel>();
    }

    async setCurrent(): Promise<AxiosResponse<SubscriptionModel>>{
        return super.post<SubscriptionModel>({});
    }

    async getOperationUsageEntries(): Promise<AxiosResponse<PageResponse<OperationUsageEntryModel>>>{
        return super.get<PageResponse<OperationUsageEntryModel>>();
    }

    async getOperationUsageDetails(): Promise<AxiosResponse<PageResponse<OperationUsageDetailModel>>>{
        return super.get<PageResponse<OperationUsageDetailModel>>();
    }

}
