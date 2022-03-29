import {ITheme} from "../../general/Theme";

interface ComponentTitleStyledProps{
    marginLeft?: string,
}

interface ComponentTitleProps extends ComponentTitleStyledProps{
    title: string,
    icon?: any,
    theme?: ITheme,
}

export {
    ComponentTitleStyledProps,
    ComponentTitleProps,
}