import {ITheme} from "../../general/Theme";
import {AppDispatch} from "@store/store";
import {NavigateFunction} from "react-router";

interface LinkMessageStyledProps{
    notClickable?: boolean,
}

interface LinkMessageProps{
    theme?: ITheme,
    message: string,
    link?: string,
    shouldSetSearchValue?: boolean,
    dispatch?: AppDispatch,
    navigate?: NavigateFunction,
}

export {
    LinkMessageProps,
    LinkMessageStyledProps,
}