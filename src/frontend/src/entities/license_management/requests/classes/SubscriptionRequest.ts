import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ISubscriptionRequest from "@entity/license_management/requests/interfaces/ISubscriptionRequest";
import SubscriptionModel, {
    OperationUsageDetailModel,
    OperationUsageEntryModel
} from "@entity/license_management/requests/models/SubscriptionModel";

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

    async getOperationUsageEntries(): Promise<AxiosResponse<OperationUsageEntryModel[]>>{
        this.endpoint = '/operation/usage';
        return super.get<OperationUsageEntryModel[]>();
    }

    async getOperationUsageDetails(): Promise<AxiosResponse<OperationUsageDetailModel[]>>{
        this.endpoint = '/operation/usage/details';
        return super.get<OperationUsageDetailModel[]>();
    }

}
