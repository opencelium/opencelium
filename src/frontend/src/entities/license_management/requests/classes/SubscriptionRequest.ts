import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ISubscriptionRequest from "@entity/license_management/requests/interfaces/ISubscriptionRequest";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";

export default class SubscriptionRequest extends Request implements ISubscriptionRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'subscription', ...settings});
    }

    async getAll(): Promise<AxiosResponse<SubscriptionModel[]>>{
        this.endpoint = '/all';
        return super.get<SubscriptionModel[]>();
    }

    async getCurrent(): Promise<AxiosResponse<SubscriptionModel>>{
        this.endpoint = '/current';
        return super.get<SubscriptionModel>();
    }

    async setCurrent(subscriptionId: string): Promise<AxiosResponse<SubscriptionModel>>{
        this.endpoint = '/current';
        return super.post<SubscriptionModel>({subscriptionId});
    }

}
