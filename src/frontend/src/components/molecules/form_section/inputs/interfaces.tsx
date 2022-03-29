import {ITheme} from "../../../general/Theme";

interface InputsStyledProps{
    height?: string | number,
}

interface InputsProps extends InputsStyledProps{
    theme?: ITheme,
}


export {
    InputsProps,
    InputsStyledProps,
}