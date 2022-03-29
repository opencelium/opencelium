import {ITheme} from "../../general/Theme";
import React from "react";

interface CalloutStyledProps{
    hasFoot?: boolean,
    theme?: ITheme,
}
interface CalloutProps extends CalloutStyledProps{
    message: string,
    hasFoot?: boolean,
    icon?: React.ReactNode,
    theme?: ITheme,
}

interface TopBarProps{
    theme?: ITheme,
}

interface NotificationItemProps{
    theme?: ITheme,
}

interface SearchProps{
    theme?: ITheme,
}

export {
    CalloutStyledProps,
    CalloutProps,
    TopBarProps,
    NotificationItemProps,
    SearchProps,
}