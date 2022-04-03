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
import {MethodTitleStyledProps} from "@organism/operation_items/interfaces";
import {REQUEST_METHOD} from "@requestInterface/application/IRequest";
import Button from "@atom/button/Button";

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
    float: right;
    margin-left: 10px;
`;

export {
    OperationItemsStyled,
    HeaderStyled,
    MethodTitleStyled,
    DeleteButtonStyled,
}