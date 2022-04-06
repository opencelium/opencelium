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