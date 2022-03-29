import React, {Ref} from "react";
import {ITheme} from "../../general/Theme";


interface CheckStyledProps{
    hasLabel?: boolean,
    marginTop?: string | number,
    paddingTop?: string | number,
}

interface InputElementProps{
    callback?: any,
    paddingTop?: string | number,
    marginTop?: string | number,
    error?: string,
    icon?: string,
    label?: string,
    isLoading?: boolean,
    isIconInside?: boolean,
    maxLength?: number | undefined,
    value?: string | readonly string[] | number | undefined,
    placeholder?: string | undefined,
    required?: boolean | undefined,
    readOnly?: boolean | undefined,
    marginLeft?: string | number,
    width?: string | number,
    noIcon?: boolean,
    hasUnderline?: boolean,
    display?: string,
    minHeight?: string | number,
    background?: string,
}

interface InputProps extends InputElementProps{
    componentRef?: Ref<HTMLDivElement>,
    overflow?: string,
    isTextarea?: boolean,
    labelMargin?: string,
    paddingTop?: string | number,
    paddingBottom?: string,
    paddingLeft?: string,
    minHeight?: string | number,
    hasUnderline?: boolean,
    afterInputComponent?: any,
    height?: string | number,
    className?: string,
}

/*
* TODO: replace with React.CSSProperties
*/
interface ElementProps{
    key?: any,
    paddingLeft?: string | number,
    paddingTop?: string | number,
    paddingRight?: string | number,
    width?: string | number,
    left?: number,
    right?: number,
    emphasizeColor?: string,
    marginLeft?: string | number,
    marginTop?: string | number,
    marginBottom?: string | number,
    isIconInside?: boolean,
    hasIcon?: boolean,
    isTextarea?: boolean,
    theme?: ITheme,
    readOnly?: boolean,
    hasNotUnderline?: boolean,
    noAnimation?: boolean,
    background?: string,
    paddingLeftInput?: string,
    paddingRightInput?: string,
}

interface InputStyledProps{
    overflow?: string,
    display?: string,
    marginBottom?: string,
    paddingTop?: string | number,
    paddingBottom?: string,
    marginTop?: string | number,
    marginLeft?: string,
    minHeight?: string | number,
    height?: string | number,
    width?: string | number,
    background?: string,
}

interface IconStyledProps{
    left?: string | number;
    right?: string | number;
    top?: string | number;
    paddingTop?: string | number;
}

interface ErrorStyledProps{
    isIconInside?: boolean,
    hasIcon?: boolean,
}

interface LabelStyledProps{
    isIconInside?: boolean,
    hasIcon?: boolean,
    paddingTop?: string | number;
    labelMargin?: string,
}

export {
    CheckStyledProps,
    InputProps,
    InputElementProps,
    ElementProps,
    InputStyledProps,
    LabelStyledProps,
    IconStyledProps,
    ErrorStyledProps,
}