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
import Text from "../../text/Text";
import {ButtonStyledProps, InputProps, TextStyledProps} from "./interfaces";
import Button from "../../button/Button";
import {ElementProps} from "../interfaces";
import {EmphasizeInputStyleLines} from "../styles";

const CheckboxStyled = styled.input`
    margin-top: ${({theme}) => theme.input.inputElement.paddingTop || 0};
    margin-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    position: absolute;
    left: ${({theme}) => theme.input.iconInputDistance};
    top: 26px;
`;

const TextStyled = styled(Text)<TextStyledProps>`
    padding-top: ${({theme}) => theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    margin-top: ${({marginTop}) => marginTop || 0};
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    margin-left: ${({hasIcon, isIconInside, hasCheckbox, theme}) => !hasIcon || isIconInside ? 0 : `${hasCheckbox ? '70px' : theme.input.iconInputDistance}`};
    width: ${({width, isIconInside, hasIcon, hasCheckbox, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${hasCheckbox ? '70px' : theme.input.iconInputDistance})`};
    border-bottom: ${({hasBorder}) => hasBorder ? '1px solid #c1c1c1' : 'none'};
`;

const ButtonStyled = styled(Button)<ButtonStyledProps>`
    margin-top: ${({marginTop}) => marginTop || 0};
    ${EmphasizeInputStyleLines}
    &:hover + div{
        width: ${({hasIcon, isIconInside, width, theme, hasCheckbox}) => width ? width : (!hasIcon || isIconInside) ? '100%' : `calc(100% - ${theme.input.iconInputDistance}${hasCheckbox ? ' - 20px' : ''})`};
        background: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? emphasizeColor || theme.input.text.color.quite : 'unset'};
    }
    &:focus + div{
        width: ${({hasIcon, isIconInside, width, theme, hasCheckbox}) => width ? width : (!hasIcon || isIconInside) ? '100%' : `calc(100% - ${theme.input.iconInputDistance}${hasCheckbox ? ' - 20px' : ''})`};
        background: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? emphasizeColor || theme.input.text.color.quite : 'unset'};
    }
    & + div{
        margin-left: ${({marginLeft, hasIcon, isIconInside, theme, hasCheckbox}) => marginLeft ? marginLeft : (!hasIcon || isIconInside) ? 0 : `calc(${theme.input.iconInputDistance}${hasCheckbox ? ' + 20px' : ''})`};
    }
`;

const FileStyled = styled.input<ElementProps & TextStyledProps>`
    padding-top: ${({theme}) => theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    position: absolute;
    opacity: 0;
    left: ${({left}) => left || '0'};
    transition: border-bottom-color 0.5s;
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    width: ${({width, isIconInside, hasIcon, hasCheckbox, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${hasCheckbox ? '70px' : theme.input.iconInputDistance})`};
    margin-left: ${({hasIcon, isIconInside, hasCheckbox, theme}) => !hasIcon || isIconInside ? 0 : `${hasCheckbox ? '70px' : theme.input.iconInputDistance}`};
    margin-top: ${({marginTop}) => marginTop || 0};
`;

const InputStyled = styled.input<InputProps>`
    border-top: none;
    border-right: none;
    border-bottom: 1px solid #c1c1c1;
    border-left: none;
    outline: none;
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    width: ${({width}) => width || '100%'};
    transition: border-bottom-color 0.5s;
`;

export {
    CheckboxStyled,
    TextStyled,
    InputStyled,
    FileStyled,
    ButtonStyled,
}