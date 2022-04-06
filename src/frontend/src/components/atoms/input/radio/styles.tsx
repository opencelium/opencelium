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

import styled from "styled-components";
import chroma from "chroma-js";
import { ITheme } from "../../../general/Theme";
import {InputRadiosStyledProps, RadiosAlign, RadioStyledProps} from "@atom/input/radio/interfaces";

const InputRadiosStyled = styled.span<InputRadiosStyledProps>`
    display: inline-block;
    outline: none;
    border: none;
    transition: border-bottom-color 0.5s;
    padding-top: ${({theme}) => theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    margin-top: ${({marginTop}) => marginTop || 0};
`;

const RadioStyled = styled.span<RadioStyledProps>`
    display: ${({align}) => align === RadiosAlign.Vertical ? 'inline-block' : 'block'};
    margin-left: ${({marginLeft}) => marginLeft || 0};
    margin-right: 10px;
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    width: ${({width}) => width || 'unset'};
    & input:focus, & input:focus-within{
        background: ${({background, theme}: {background?: string, theme: ITheme}) => background || theme.button.background.quite};
        box-shadow: 0 0 0 0.2rem ${({background, color, theme, hasBackground}: {background?: string, color?: string, theme: ITheme, hasBackground: boolean}) => `${chroma(background || theme.button.background.quite).alpha(0.4)}`};
        outline: none;
    }
    & :first-child{
        margin-right: 5px;
    }
`;

export {
    RadioStyled,
    InputRadiosStyled,
}