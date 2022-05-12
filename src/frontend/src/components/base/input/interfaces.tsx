/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Ref} from "react";
import {ITheme} from "@style/Theme";


interface CheckStyledProps{
    marginTop?: string | number,
    paddingTop?: string | number,
    paddingRight?: string | number,
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
    paddingLeft?: string | number,
    paddingRight?: string | number,
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
    paddingLeft?: string | number,
    paddingRight?: string | number,
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
    paddingLeft?: string | number;
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