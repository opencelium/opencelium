/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import { PermissionProps } from "@application/interfaces/IApplication";
import {ITheme} from "@style/Theme";

interface ButtonStyledProps{
    width?: string,
    size?: string | number,
    float?: string,
    position?: string,
    right?: number,
    bottom?: number,
    top?: string | number,
    padding?: string | number,
    margin?: string | number,
    hasBackground: boolean,
    background: string,
    isContentCentralized: boolean,
    hasLabel?: boolean,
    isDisabled?: boolean,
    iconSize?: string,
}

interface SpinnerStyledProps{
    size: string | number,
    color: string,
    position: string,
    left?: string | number,
    top?: string | number,
}

interface LabelStyledProps{
    opacity: number,
    size: string,
    color: string,
    hasBackground: boolean,
    hasIcon?: boolean,
}

interface ButtonProps {
    id?: string,
    autoFocus?: boolean,
    hasConfirmation?: boolean,
    confirmationText?: string,
    href?: string,
    color?: string,
    background?: string,
    icon?: string,
    label?: string,
    size?: string | number,
    iconSize?: string,
    isDisabled?: boolean,
    isLoading?: boolean,
    hasBackground?: boolean,
    handleClick?: (e?: any) => void,
    onBlur?: (e: any) => void,
    theme?: ITheme,
    position?: string,
    right?: number,
    top?: number | string,
    padding?: number | string,
    margin?: string | number,
    bottom?: number,
    float?: string,
    permission?: PermissionProps,
    className?: string,
}


export {
    ButtonStyledProps,
    SpinnerStyledProps,
    LabelStyledProps,
    ButtonProps,
}