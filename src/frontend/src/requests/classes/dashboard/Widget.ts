import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IWidgetRequest} from "../../interfaces/dashboard/IWidget";
import {IWidget} from "@interface/dashboard/IWidget";


export class WidgetRequest extends Request implements IWidgetRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'widget', ...settings});
    }

    async getAllWidgets(): Promise<AxiosResponse<IWidget[]>>{
        this.endpoint = '/all';
        return super.get<IWidget[]>();
    }
}