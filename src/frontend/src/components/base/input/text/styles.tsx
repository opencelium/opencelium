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
import {ITheme} from "@style/Theme";
import {EmphasizeInputStyleLines} from "../styles";
import {CheckStyledProps, ElementProps} from "../interfaces";
import Button from "../../button/Button";

const InputStyled = styled.input<ElementProps>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    background: ${({background}) => background ? background : 'unset'};
    outline: none;
    border: none;
    cursor: ${({readOnly}) => readOnly ? 'default' : 'text'};
    transition: border-bottom-color 0.5s;
    padding-left: ${({paddingLeft, paddingLeftInput}) => paddingLeftInput ? paddingLeftInput : paddingLeft || 0};
    padding-right: ${({paddingRight, paddingRightInput}) => paddingRightInput ? paddingRightInput : paddingRight || 0};
    padding-top: ${({paddingTop, theme}) => paddingTop || theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width ? width : isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({marginLeft, hasIcon, isIconInside, theme}) => marginLeft ? marginLeft : !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    margin-top: ${({marginTop}) => marginTop || 0};
    height: ${({height}) => height || 'auto'};
    border-bottom: 1px solid #e9e9e9;
    ${EmphasizeInputStyleLines}
`;

const CheckStyled = styled(Button)<CheckStyledProps>`
    position: absolute;
    right: ${({paddingRight}) => `calc(${paddingRight || '0px'} + 2px)` || '2px'};
    top: 7px;
    margin-top: ${({marginTop, paddingTop}) => marginTop || paddingTop || 0};
    opacity: 1 !important;
`;

export {
    InputStyled,
    CheckStyled,
}