import {TextSize} from "@atom/text/interfaces";
import {ITheme} from "../../general/Theme";

interface LoadingProps{
    size?: TextSize,
    theme?: ITheme,
    color?: string,
    className?: string,
}

export {
    LoadingProps,
}