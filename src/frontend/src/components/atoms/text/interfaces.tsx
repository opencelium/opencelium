import {ColorTheme, ITheme} from "../../general/Theme";

export enum TextSize{
    Size_10= '10px',
    Size_12= '12px',
    Size_14= '14px',
    Size_16= '16px',
    Size_18= '18px',
    Size_20= '20px',
    Size_24= '24px',
    Size_30= '30px',
}

interface TextProps extends TextStyledProps{
    value?: any,
    namespace?: string,
    transKey?: string,
    color?: ColorTheme,
    size?: TextSize,
    hasTitle?: boolean,
    theme?: ITheme,
}


interface TextStyledProps{
    isBold?: boolean,
    paddingLeft?: string,
    width?: string,
    display?: string,
    borderBottom?: string,
}

export {
    TextProps,
    TextStyledProps,
}