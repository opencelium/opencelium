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
import {HeaderStyledProps, LoginFormStyledProps} from "@page/login/interfaces";

const LoginFormStyled = styled.div<LoginFormStyledProps>`
    position: relative;    
    background: ${({theme}) => theme.menu.background || '#012E55'};
    border-radius: 6px;
    width: 300px;
    height: 275px;
    top: 30px;
    position: absolute;
    left: calc(50% - 150px);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    transition: all 0.5s ease-in;
    &:hover{
        box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
    }
    ${({isAuth}) => isAuth ? `
        height: 100vh;
        left: 0;
        top: 0;
        width: 95px;
        border-radius: 0 !important;
    ` : ''}
`;

const HeaderStyled = styled.div<HeaderStyledProps>`
    font-family: ${({theme}) => theme.text.fontFamily || '"Arial"'};
    font-size: 20px;
    padding: 10px;
    color: #fff;
    text-align: center;
    height: 50px;
    transition: all 0.5s ease-in;
    ${({isAuth}) => isAuth ? `
        height: 0;
        overflow: hidden;
        padding: 0;
    ` : ''}
`;

export {
    LoginFormStyled,
    HeaderStyled,
}