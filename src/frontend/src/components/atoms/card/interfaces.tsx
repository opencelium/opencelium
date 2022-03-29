import {ITheme} from "../../general/Theme";

interface CardProps{
    isButton?: boolean,
    isVisible?: boolean,
    padding?: string | number,
    margin?: string | number,
    theme?: ITheme,
    isListCard?: boolean,
    gridViewType?: number,
    onClick?: any,
    isRefreshing?: boolean;
    display?: string;
    overflow?: string;
}

export{
    CardProps,
}