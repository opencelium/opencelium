/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Ref} from "react";
import {ColorTheme, ITheme} from "@style/Theme";
import {ElementProps, InputElementProps} from "../interfaces";
import {CategoryModel} from "@entity/category/requests/models/CategoryModel";

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
    indentLevel?: number,
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
    getOptionRightComponent?: (option: OptionProps) => any,
}

interface AsyncOptionProps{
    action: any,
    mapping: any,
}

interface InputSelectProps extends InputElementProps{
    autoFocus?: boolean,
    getOptionRightComponent?: (option: OptionProps) => any,
    id?: string,
    value?: any,
    color?: ColorTheme,
    placeholder?: string,
    options?: OptionProps[] | AsyncOptionProps,
    isSearchable?: boolean,
    onChange?: (option: string | string[]) => void,
    isMultiple?: boolean | undefined,
    callback?: (reference: any, newValue?: any)=>void,
    className?: string,
    maxMultiValues?: number,
    checkboxProps?: any,
    categoryList?: boolean,
    currentCategory?: CategoryModel | null,
}

interface OptionsStyledProps extends ElementProps{
    isVisible?: boolean | undefined,
    height?: string | number,
    top?: number,
    categoryList?: boolean
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
