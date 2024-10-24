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

import React, {InputHTMLAttributes} from "react";
import {ITheme} from "@style/Theme";
import {ElementProps, InputElementProps} from "../interfaces";
import {ButtonProps} from "@app_component/base/button/interfaces";

interface InputFileProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value">, Omit<InputElementProps, "value">{
    value?: readonly string[],
    hasNoImage?: boolean,
    onToggleHasImage?: (hasImage: boolean) => void,
    hasCheckbox?: boolean,
    hasCrop?: boolean,
    theme?: ITheme,
    showOnlyButton?: boolean,
    buttonProps?: ButtonProps,
}

interface InputProps extends ElementProps{
}

interface TextStyledProps extends ElementProps{
    hasBorder?: boolean,
    hasCheckbox?: boolean,
}

interface ButtonStyledProps extends ElementProps{
    hasCheckbox?: boolean,
}


export {
    InputProps,
    InputFileProps,
    TextStyledProps,
    ButtonStyledProps,
}
