/*
 *  Copyright (C) <2022> <becon GmbH>
 *
 *  Licensed under the Apache License, Version 2.0 (the „License");
 *  you may not #use this file except in compliance with the License.
 *  You may obtain a copy #of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an „AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import styled from "styled-components";
import Text from "../../text/Text";
import {ButtonStyledProps, InputProps, TextStyledProps} from "./interfaces";
import Button from "../../button/Button";
import {ElementProps} from "../interfaces";
import Icon from "@app_component/base/icon/Icon";

const ChosenFilesStyled = styled.span`
    display: block;    
    position: absolute;
    right: 0;
    margin: 15px 0px 30px;
    display: grid;
    gap: 10px;
    &>div{
        display: flex;
        flex-direction: row-reverse;
        &>span{
            align-items: center;
            justify-content: center;
            margin-left: 5px;
            display: flex;
        }
        &>div{
            position: relative;
            padding: 3px 15px 3px 5px;
            border-radius: 3px;
            border: 1px solid #eee;
            text-align: right;
        }
    }
`;

const OnlyChosenFilesStyled = styled.span`
    display: block;    
    position: absolute;
    right: 0;
    margin: 30px 30px;
    display: grid;
    gap: 10px;
    &>div{
        padding: 3px 15px 3px 5px;
        border-radius: 3px;
        border: 1px solid #eee;
        text-align: center;
        position: relative;
    }
`;

const DeleteIconStyled = styled(Icon)`
    cursor: pointer;
    position: absolute;
    right: 0;
    to: 0;
`;

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

const OnlyButtonStyled = styled(Button)<ButtonStyledProps>`
    margin-top: ${({marginTop}) => marginTop || 0};
`;

const OnlyFileStyled = styled.input<ElementProps & TextStyledProps>`
    width: 0;
    opacity: 0;
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
    ChosenFilesStyled,
    OnlyChosenFilesStyled,
    DeleteIconStyled,
    CheckboxStyled,
    TextStyled,
    InputStyled,
    FileStyled,
    OnlyFileStyled,
    ButtonStyled,
    OnlyButtonStyled,
}