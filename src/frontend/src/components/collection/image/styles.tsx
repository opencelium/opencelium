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
import {GridImageAppearance, GridImageRefreshing} from "@style/animations";
import {ImageStyledProps} from "./interfaces";

const ImageStyled = styled.div<ImageStyledProps>`
    position: relative;
    & img{
        ${({isRefreshing}) => isRefreshing ? GridImageRefreshing : ''}
        width: 80px;
        max-height: 100px;
    }
    float: right;
`;

const UploadButtonStyled = styled.div`
    & button{
        ${GridImageAppearance}
    }
    border-radius: 2px;
    top:0;
    position: absolute;
    width: 80px;
    justify-content: center;
    display: flex;
    height: 100%;
    background-color: rgba(0,0,0,0.2); 
`;


export {
    ImageStyled,
    UploadButtonStyled,
}