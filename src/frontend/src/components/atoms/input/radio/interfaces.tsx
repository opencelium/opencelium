import React, {InputHTMLAttributes, Key} from "react";
import {ElementProps, InputElementProps} from "../interfaces";
import {ITheme} from "../../../general/Theme";

enum RadiosAlign{
    Horizontal= 'horizontal',
    Vertical= 'vertical',
}

interface InputRadioProps extends InputHTMLAttributes<HTMLInputElement>{
    align?: RadiosAlign,
    label?: string,
    key: Key,
    icon?: string,
    marginLeft?: string | number,
    theme?: ITheme,
    currentValue?: string | number | readonly string[],
}

interface InputRadiosProps extends InputHTMLAttributes<HTMLInputElement>, InputElementProps{
    options: InputRadioProps[],
    theme?: ITheme,
    align?: RadiosAlign,
}

interface InputRadiosStyledProps extends ElementProps{
}
interface RadioStyledProps extends ElementProps{
    align?: RadiosAlign,
}


export {
    RadiosAlign,
    InputRadioProps,
    InputRadiosProps,
    InputRadiosStyledProps,
    RadioStyledProps,
}