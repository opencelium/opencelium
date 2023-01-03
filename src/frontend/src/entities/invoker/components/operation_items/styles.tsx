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
import { REQUEST_METHOD } from "@application/requests/interfaces/IApplication";
import Button from "@app_component/base/button/Button";
import {MethodTitleStyledProps} from "./interfaces";
import Icon from "@app_component/base/icon/Icon";
import { ITheme } from "@style/Theme";

const OperationItemsStyled = styled.div`
    & :not(:first-child) {
        margin-top: -3px;
    }
`;

const HeaderStyled = styled.div`
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    float: left;
`;

const ValidationMessageStyled = styled.span`
    font-size: 14px;
    color: ${({color, theme}: {color?: string, theme: ITheme}) => color || theme.input.error.color};
`;

const RightContainerStyled = styled.div`
    display: flex;
    justify-content: end;
    gap: 10px;
    align-items: center;
`;

const MethodTitleStyled = styled.div<MethodTitleStyledProps>`
    float: right;
    padding: 1px;
    width: 70px;
    text-align: center;
    border-radius: 3px;
    color: #fff;
    background-color: ${({method}) => {
        switch(method){
            case REQUEST_METHOD.POST:
                return '#10a54a';
            case REQUEST_METHOD.GET:
                return '#0f6ab4';
            case REQUEST_METHOD.PUT:
                return '#c5862b';
            case REQUEST_METHOD.DELETE:
                return '#a41e22';
        }      
    }};
`;

const DeleteButtonStyled = styled(Button)`
`;

const TestConnectionIconStyled = styled(Icon)`
    color: green; 
`;

export {
    OperationItemsStyled,
    HeaderStyled,
    RightContainerStyled,
    MethodTitleStyled,
    DeleteButtonStyled,
    TestConnectionIconStyled,
    ValidationMessageStyled,
}