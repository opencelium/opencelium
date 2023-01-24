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

import styled from "styled-components";
import {ITheme} from "@style/Theme";
import {TextStyledProps} from './interfaces';

const TextStyled = styled.span<TextStyledProps>`
    color: ${({color, theme}:{color:string, theme: ITheme}) => color || 'inherit'};
    font-size: ${({size, theme}:{size:string, theme: ITheme}) => size || theme.text.size || '16px'};
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    padding-left: ${({paddingLeft}) => paddingLeft || '0'};
    width: ${({width}) => width || 'unset'};
    display: ${({display}) => display || 'unset'};
    border-bottom: ${({borderBottom}) => borderBottom || 'none'};
    font-weight: ${({isBold}) => isBold ? '600' : 'unset'};
`;

export {
    TextStyled,
}