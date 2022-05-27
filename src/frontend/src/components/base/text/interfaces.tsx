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

import {ColorTheme, ITheme} from "@style/Theme";

export enum TextSize{
    Size_10= '10px',
    Size_12= '12px',
    Size_14= '14px',
    Size_16= '16px',
    Size_18= '18px',
    Size_20= '20px',
    Size_24= '24px',
    Size_30= '30px',
}

interface TextProps extends TextStyledProps{
    value?: any,
    namespace?: string,
    transKey?: string,
    color?: string,
    size?: TextSize,
    hasTitle?: boolean,
    theme?: ITheme,
}


interface TextStyledProps{
    isBold?: boolean,
    paddingLeft?: string,
    width?: string,
    display?: string,
    borderBottom?: string,
}

export {
    TextProps,
    TextStyledProps,
}