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

const FormSectionIconsStyled = styled.div`
    border-radius: 6px 6px 30px 30px;
    position: absolute;
    top: 0;
    z-index: 100;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    text-align: center;
    clip-path: polygon(0 0, 100% 0, 84% 100%, 16% 100%);
    width: 100px;
    background: ${({theme}: {theme: ITheme}) => theme.button.background.quite || 'rgb(1, 46, 85)'};
    color: white;
    height: 5px;
    transition: all 0.3s;
    &>div:first-child{
        text-align: center;
        margin-top: -14px;
        position: absolute;
        left: 44px;
    }
    &>div:nth-child(2){
        position: relative;
        width: 100px;
        &>span{
            height: 22px;
            button{
                width: 20px;
                &>span{
                    vertical-align: middle;
                }
            }
        }
    }
    &:hover{
        height: 30px;
        &>div:first-child{
            display: none;
        }
    }
`;

export {
    FormSectionIconsStyled,
}