import {AxiosResponse} from "axios";
import {IWidgetSetting} from "@interface/dashboard/IWidgetSetting";

export interface WidgetSettingsProps{
    userId: number,
    widgetSettings: IWidgetSetting[],
}

export interface IWidgetSettingRequest{

    //to get all widget settings by user id
    getAllWidgetSettingsByUserId(): Promise<AxiosResponse<WidgetSettingsProps>>,

    //to update widget settings of authorized user
    updateAllWidgetSettings(widgetSettings: WidgetSettingsProps): Promise<AxiosResponse<WidgetSettingsProps>>,
}