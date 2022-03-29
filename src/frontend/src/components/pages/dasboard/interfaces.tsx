import {ITheme} from "../../general/Theme";
import {ReactGridLayoutProps} from "react-grid-layout";

interface DashboardFormProps{
    theme?: ITheme,
}

interface WidgetItemStyledProps{
    isWidgetEditOn?: boolean,
}

interface ReactGridLayoutStyledProps extends ReactGridLayoutProps{
    isWidgetEditOn?: boolean,
    isLayoutEmpty?: boolean,
}

export {
    DashboardFormProps,
    WidgetItemStyledProps,
    ReactGridLayoutStyledProps,
}
