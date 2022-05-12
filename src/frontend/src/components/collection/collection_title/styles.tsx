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

import {Link} from "react-router-dom";
import styled from "styled-components";
import {ITheme} from "@style/Theme";

const TitleStyled = styled.div`
    margin-top: 40px;
    font-family: ${({theme}: {theme: ITheme}) => theme.text.fontFamily};
    color: ${({theme}: {theme: ITheme}) => theme.collectionView.title.color.quite};
    & >span{
        position: relative;
    }
`;

const LinkStyled = styled(Link)`
    color: black;
    &:hover{
        color: black;
    }
`;

const IconStyled = styled.span`
    position: absolute;
    right: -15px;
    top: -12px;
`;

export {
    TitleStyled,
    LinkStyled,
    IconStyled,
}