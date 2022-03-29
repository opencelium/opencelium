import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IWidgetSettingRequest, WidgetSettingsProps} from "../../interfaces/dashboard/IWidgetSetting";


export class WidgetSettingRequest extends Request implements IWidgetSettingRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'widget_setting', ...settings});
    }

    async getAllWidgetSettingsByUserId(): Promise<AxiosResponse<WidgetSettingsProps>>{
        return super.get<WidgetSettingsProps>();
    }

    async updateAllWidgetSettings(widgetSettings: WidgetSettingsProps): Promise<AxiosResponse<WidgetSettingsProps>>{
        return super.post<WidgetSettingsProps>(widgetSettings);
    }
}