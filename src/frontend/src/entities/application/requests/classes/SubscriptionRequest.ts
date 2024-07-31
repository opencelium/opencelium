import Request from "@entity/application/requests/classes/Request";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {AxiosResponse} from "axios";
import ISubscriptionRequest from "@entity/application/requests/interfaces/ISubscriptionRequest";
import SubscriptionModel from "@entity/application/requests/models/SubscriptionModel";

export default class SubscriptionRequest extends Request implements ISubscriptionRequest {

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'subscription', ...settings});
    }

    async getAll(): Promise<AxiosResponse<SubscriptionModel[]>>{
        this.endpoint = '/all';
        return super.get<SubscriptionModel[]>();
    }

}
