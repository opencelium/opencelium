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
import {EmphasizeInputStyleLines} from "../styles";
import {ElementProps} from "../interfaces";
import Icon from "../../icon/Icon";
import Text from "../../text/Text";
import Button from "../../button/Button";
import {ToggleStyledProps, InputContainerStyledProps, OptionsStyledProps, OptionStyledProps} from "./interfaces";
import {ITheme} from "../../../general/Theme";


const EmptyOptionsStyled = styled.div`
    background: #ffffff;
    min-height: 34px;
    padding: 5px
`;

const LineStyled = styled.div<ElementProps>``

const OptionsStyled = styled.div<OptionsStyledProps | HTMLDivElement>`
    transition: height 0.3s;
    user-select: none;
    position: absolute;
    z-index: 1000;
    border-bottom-left-radius: ${({height}) => height !== 0 ? `5px` : '0'};
    border-bottom-right-radius: ${({height}) => height !== 0 ? `5px` : '0'};
    border: ${({isVisible}) => isVisible ? `1px solid #c1c1c1` : 'none'};
    border-top: none;
    height: ${({height}) => `${height}px` || 0};
    max-height: 200px;
    overflow-x: hidden;
    overflow-y: ${({height}) => height > 200 ? `auto` : 'hidden'};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    
    &::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    &::-webkit-scrollbar-track {
      background: #888;
    }
    &::-webkit-scrollbar-thumb {
      background: #464646;
    }
    &::-webkit-scrollbar-thumb:hover {
      cursor: default;
      background: #111;
    }
    @media screen and (max-width: 950px) {
        position: static;
    }
`;

const DropdownIconStyled = styled(Icon)`
    position: absolute;
    right: 6px;
    top: 5px;
`
const TextStyled = styled(Text)<ElementProps>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    cursor: default;
`;
const SearchInputStyled = styled.input<ElementProps | HTMLInputElement>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    flex: 1;
    padding-right: 20px;
    width: ${({width}) => width || 'auto'};
    min-width: 160px;
    cursor: default;
    border: none;
    &:focus{
        outline: none;
    }
`;

const InputContainerStyled = styled.span<InputContainerStyledProps>`
    display: inline-block;
    margin-top: ${({marginTop}) => marginTop || 0};
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
`;

const ToggleStyled = styled(Button)<ToggleStyledProps>`
    margin-top: ${({marginTop}) => marginTop || 0};
    ${EmphasizeInputStyleLines}
    & + div{
        height: 3px;
    }
`;

const SelectStyled = styled.input<ElementProps>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    cursor: default;
    position: absolute;
    opacity: 0;
    left: ${({left}) => left || '0'};
    transition: border-bottom-color 0.5s;
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    margin-top: ${({marginTop}) => marginTop || 0};
    &:hover ~div:first-of-type{
        width: ${({hasIcon, isIconInside, theme}: ElementProps) => (!hasIcon || isIconInside) ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
        background: ${({readOnly, emphasizeColor, theme}: ElementProps) => !readOnly ? emphasizeColor || theme.input.text.color.quite : 'unset'};
    }
`;

const OptionStyled = styled.input<OptionStyledProps>`
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    width: 100%;
    border: none;
    padding: 5px 5px;
    cursor: default;
    background: ${({isCurrent}) => isCurrent ? '#bbb' : '#fff'};
    &:focus{
        outline: none;
        background: ${({isCurrent}) => isCurrent ? '#bbb' : '#eee'};
    }
    &:hover{
        background: ${({isCurrent}) => isCurrent ? '#bbb' : '#eee'};
    }
`;

const MultipleValuesStyled = styled.div`
    padding-top: ${({theme}) => theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily || '"Arial"'};
    width: 100%;
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    background: white;
    &>span{
        display: inline-block;
        position: relative;
        margin: 2px;
        padding: 1px 20px 1px 2px;
        border: 1px solid black;
        font-size: 12px;
    }
    &>span:last-child{
        margin-right: 5px;
    }
`;


export {
    EmptyOptionsStyled,
    SelectStyled,
    LineStyled,
    SearchInputStyled,
    InputContainerStyled,
    OptionsStyled,
    OptionStyled,
    DropdownIconStyled,
    TextStyled,
    ToggleStyled,
    MultipleValuesStyled,
}