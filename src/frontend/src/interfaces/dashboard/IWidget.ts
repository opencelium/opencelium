export type WidgetKey = 'CONNECTION_OVERVIEW' | 'CURRENT_SCHEDULER' | 'MONITORING_BOARDS';


export interface IWidget{
    widgetId: number,

    //key for widget tool
    i: WidgetKey,
    icon: string,
    tooltipTranslationKey: string,
}