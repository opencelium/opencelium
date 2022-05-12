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
import {Appearance} from "@style/animations";
import {OverflowText} from "@style/common";
import {ThStyledProps} from "./interfaces";

const InfoStyled = styled.div`
    float: left;
    width: calc(100% - 80px);
    @media only screen and (max-width: 1044px){
        width: 100%;
    }
`;

const GridTitleStyled = styled.div`
    ${OverflowText}
`;

const GridImageStyled = styled.span`
    @media only screen and (max-width: 1044px){
        display: none;
    }
`;

const GridSubTitleStyled = styled.div`
    ${OverflowText}
`;

const GridImage = styled.img`
    width: 80px;
    max-height: 100px;
    float: right;
`;

const GridActionsStyled = styled.div`
    margin-top: auto;
    display: flex;
    & > :not(:last-child){
        margin-right: 10px;
    }
`;

const DeleteButtonStyled = styled.div`
    margin-left: auto;
`;

const CollectionViewStyled = styled.div`
    ${Appearance}
    margin: 20px 0;
`;
const GridStyled = styled.div`
    margin: 20px 0;
    display: flex;
    flex-wrap: wrap;
`;

const TopSectionStyled = styled.div`
    gap: 10px 0;
    flex-wrap: wrap;
    display: flex;
    margin: 20px 0;
    width: 100%;
    & > :last-child{
        margin-left: auto;
    }
`;

const ViewSectionStyled = styled.div`
    & > :not(:first-child){
        margin-left: 5px;
    }
`;

const ActionsStyled = styled.div`
    & > *{
        margin-right: 10px;
    }
`;

const ThStyled = styled.th<ThStyledProps>`
    width: ${({width}) => width || 'auto'}
`;

export {
    InfoStyled,
    GridTitleStyled,
    GridSubTitleStyled,
    GridActionsStyled,
    DeleteButtonStyled,
    CollectionViewStyled,
    GridStyled,
    TopSectionStyled,
    ViewSectionStyled,
    ActionsStyled,
    ThStyled,
    GridImage,
    GridImageStyled,
}