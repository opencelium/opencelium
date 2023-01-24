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

import React, {InputHTMLAttributes, Key} from "react";
import {ITheme} from "@style/Theme";
import {ElementProps, InputElementProps} from "../interfaces";

interface InputSwitchProps extends InputHTMLAttributes<HTMLInputElement>, InputElementProps{
    label?: string,
    key?: Key,
    icon?: string,
    marginLeft?: string | number,
    theme?: ITheme,
    isChecked?: boolean | undefined,
    position?: string,
    hasConfirmation?: boolean,
    confirmationText?: any,
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