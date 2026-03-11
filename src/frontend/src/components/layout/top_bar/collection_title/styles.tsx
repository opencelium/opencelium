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

import {Link} from "react-router-dom";
import styled from "styled-components";
import {ITheme} from "@style/Theme";

const TitleStyled = styled.div`
    font-family: ${({theme}: {theme: ITheme}) => `Open Sans, "Arial", sans-serif`};
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

const ConnectionEditableTitleStyled = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
`;

const ConnectionTitleTextStyled = styled.span`
    display: inline-flex;
    align-items: center;
`;

const ConnectionTitleActionsStyled = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 2px;
`;

const ConnectionTitleInputStyled = styled.input`
    font-family: ${({theme}: {theme: ITheme}) => `Open Sans, "Arial", sans-serif`};
    color: ${({theme}: {theme: ITheme}) => theme.collectionView.title.color.quite};
    min-width: 220px;
    max-width: 420px;
    height: 30px;
    padding: 0 8px;
    border: 1px solid #c7c7c7;
    border-radius: 4px;
    outline: none;
    font-size: 24px;
    line-height: 1.2;
    background: #fff;

    &:focus{
        border-color: #2372ba;
    }
`;

export {
    TitleStyled,
    LinkStyled,
    IconStyled,
    ConnectionEditableTitleStyled,
    ConnectionTitleTextStyled,
    ConnectionTitleActionsStyled,
    ConnectionTitleInputStyled,
}
