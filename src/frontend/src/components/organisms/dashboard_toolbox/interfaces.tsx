import {ITheme} from "../../general/Theme";

interface DashboardToolboxProps{
    onTakeItem: any,
    items: any[],
    theme?: ITheme,
}

interface ToolboxItemsProps{
    onTakeItem: any,
    item: any,
}

export {
    ToolboxItemsProps,
    DashboardToolboxProps,
}