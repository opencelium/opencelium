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
import {InputSwitchStyledProps} from "./interfaces";

const InputSwitcherStyled = styled.div<InputSwitchStyledProps>`
    display: inline-block;
    position: relative;
    width: 40px;
    height: 20px;
    border-radius: 15px;
    border: 1px solid #aaa;
    transition: background 0.3s;
    background: ${({isChecked, theme}) => isChecked ? theme.button.background.quite : '#fff'};
    &:after{
        content: '';
        position: absolute;
        border-radius: 50%;
        background: ${({isChecked, theme}) => isChecked ? '#fff' : theme.input.text.color.disable};
        width: 15px;
        height: 15px;
        top: 1px;
        left: ${({isChecked}) => isChecked ? '20px' : '3px'};
        transition: left 0.3s;
    }
`;

const InputSwitchStyled = styled.span<InputSwitchStyledProps>`
    padding-top: ${({theme}) => theme.input.inputElement.paddingTop || 0};
    padding-bottom: ${({theme}) => theme.input.inputElement.paddingBottom || 0};
    cursor: pointer;
    display: inline-block;
    outline: none;
    border: none;
    transition: border-bottom-color 0.5s;
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
    margin-top: ${({marginTop}) => marginTop || 0};
    & *{
        vertical-align: middle;
    }
    & :nth-child(2){
        margin-left: 5px;
    }
    ${({position}) => position === 'middle' ? `
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
    ` : ''}
`;

export {
    InputSwitcherStyled,
    InputSwitchStyled,
}