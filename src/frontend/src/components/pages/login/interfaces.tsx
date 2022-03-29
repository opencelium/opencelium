import {ITheme} from "../../general/Theme";

interface LoginFormProps{
    theme?: ITheme,
}

interface LoginFormStyledProps{
    isAuth?: boolean,
}

interface HeaderStyledProps{
    isAuth?: boolean,
}

export {
    LoginFormProps,
    LoginFormStyledProps,
    HeaderStyledProps,
}