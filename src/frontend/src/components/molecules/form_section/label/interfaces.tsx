import {ColorTheme, ITheme} from "../../../general/Theme";
import {MouseEventHandler} from "react";

interface LabelStyledProps{
    background?: ColorTheme,
    top?: string | number,
    left?: string | number,
    position?: string,
}

interface LabelProps extends LabelStyledProps{
    value?: string,
    theme?: ITheme,
    onClick?: MouseEventHandler<HTMLSpanElement>,
}


export {
    LabelProps,
    LabelStyledProps,
}