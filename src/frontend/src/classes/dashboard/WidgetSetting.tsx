import {IWidgetSetting} from "@interface/dashboard/IWidgetSetting";
import {useAppSelector} from "../../hooks/redux";
import {RootState} from "@store/store";
import {WidgetKey} from "@interface/dashboard/IWidget";

export class WidgetSetting implements IWidgetSetting{
    widgetId: number = 0;
    widgetSettingId: number = 0;
    x: number = 0;
    y: number = 0;
    w: number = 0;
    h: number = 0;
    i: WidgetKey;
    minH: number = 0;
    minW: number = 0;

    constructor(widgetSetting?: Partial<IWidgetSetting>) {
        this.widgetId = widgetSetting?.widgetId || 0;
        this.widgetSettingId = widgetSetting?.widgetSettingId || 0;
        this.x = widgetSetting?.x || 0;
        this.y = widgetSetting?.y || 0;
        this.w = widgetSetting?.w || 0;
        this.h = widgetSetting?.h || 0;
        this.i = widgetSetting?.i;
        this.minH = widgetSetting?.minH || 0;
        this.minW = widgetSetting?.minW || 0;
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.widgetSettingReducer);
    }
}