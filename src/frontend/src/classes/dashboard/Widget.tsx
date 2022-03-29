import {IWidget, WidgetKey} from "@interface/dashboard/IWidget";
import {useAppSelector} from "../../hooks/redux";
import {RootState} from "@store/store";

export class Widget implements IWidget{
    widgetId: number = 0;
    i: WidgetKey;
    icon: string = '';
    tooltipTranslationKey: string = '';

    constructor(widget?: Partial<IWidget>) {
        this.widgetId = widget?.widgetId || 0;
        this.i = widget?.i;
        this.icon = widget?.icon || '';
        this.tooltipTranslationKey = widget?.tooltipTranslationKey || '';
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.widgetReducer);
    }
}