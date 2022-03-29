import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IWebhook} from "@interface/schedule/IWebhook";
import {IWebhookRequest} from "../../interfaces/schedule/IWebhook";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";


export class WebhookRequest extends Request implements IWebhookRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'webhook', ...settings});
    }

    async getWebhookByUserIdAndScheduleId(): Promise<AxiosResponse<IWebhook>>{
        return super.get<IWebhook>();
    }

    async deleteWebhookById(): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>();
    }
}