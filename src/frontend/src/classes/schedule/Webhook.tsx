import {IWebhook} from "@interface/schedule/IWebhook";

export class Webhook implements IWebhook{
    id: number;
    url: string = '';
}