import {WidgetKey} from "@interface/dashboard/IWidget";

export interface IWidgetSetting{
    widgetId: number,
    widgetSettingId: number,

    //x coordinate
    x: number,

    //y coordinate
    y: number,

    //width
    w: number,

    //height
    h: number,

    //unique key
    i: WidgetKey,

    //min height
    minH: number,

    //min width
    minW: number,
}