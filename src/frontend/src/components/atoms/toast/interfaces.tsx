import {ITheme} from "../../general/Theme";

interface ToastProps{
    header: any,
    body: any,
    left: string | number,
    top: string | number,
    theme?: ITheme,
}

export {
    ToastProps,
}