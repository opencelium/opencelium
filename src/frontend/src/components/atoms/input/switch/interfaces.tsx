import React, {InputHTMLAttributes, Key} from "react";
import {ElementProps, InputElementProps} from "../interfaces";
import {ITheme} from "../../../general/Theme";

interface InputSwitchProps extends InputHTMLAttributes<HTMLInputElement>, InputElementProps{
    label?: string,
    key?: Key,
    icon?: string,
    marginLeft?: string | number,
    theme?: ITheme,
    isChecked?: boolean | undefined,
    position?: string,
}

interface InputSwitchStyledProps extends ElementProps{
    isChecked?: boolean | undefined;
    onClick?: (e: React.MouseEvent) => void,
    position?: string,
}


export {
    InputSwitchProps,
    InputSwitchStyledProps,
}