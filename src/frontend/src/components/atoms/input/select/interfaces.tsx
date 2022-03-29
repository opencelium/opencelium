import React, {Ref} from "react";
import {ElementProps, InputElementProps} from "../interfaces";
import {ColorTheme, ITheme} from "../../../general/Theme";

interface OptionsProps{
    currentOption?: OptionProps,
    searchValue?: string,
    toggle?: any,
    inputRef?: any,
    componentRef?: Ref<HTMLDivElement>,
    options?: OptionProps[],
    isToggled?: boolean,
    setOption?: any,
    isVisible?: boolean,
    height?: string | number,
    color?: ColorTheme,
    theme?: ITheme,
}

interface InputContainerStyledProps extends ElementProps{
    hasBorder?: boolean,
}

interface OptionStyledProps{
    isCurrent?: boolean,
}

interface OptionProps extends OptionStyledProps{
    onClick?: any,
    onKeyPress?: any,
    value: string | number | null,
    label: string,
    theme?: ITheme,
    tabIndex?: number,
    onKeyDown?: any,
    data?: any,
}

interface AsyncOptionProps{
    action: any,
    mapping: any,
}

interface InputSelectProps extends InputElementProps{
    id?: string,
    value?: any,
    color?: ColorTheme,
    options?: OptionProps[] | AsyncOptionProps,
    isSearchable?: boolean,
    onChange?: (option: string | string[])=>void,
    isMultiple?: boolean | undefined,
    callback?: (reference: any, newValue?: any)=>void,
    className?: string,
}

interface OptionsStyledProps extends ElementProps{
    isVisible?: boolean | undefined,
    height?: string | number,
    top?: number,
}

interface ToggleStyledProps extends ElementProps{
}

export {
    OptionsProps,
    OptionStyledProps,
    InputSelectProps,
    OptionProps,
    OptionsStyledProps,
    ToggleStyledProps,
    InputContainerStyledProps,
}