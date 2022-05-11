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
import {Link} from "react-router-dom";
import TooltipButton from "../tooltip_button/TooltipButton";
import Text from "@atom/text/Text";
import {ITheme} from "../../general/Theme";
import {MenuLinkLogoStyled} from './interfaces';

const getNavLinkStyles = (theme: ITheme) => { return `
    margin: 2px;
    display: grid;
    grid-template-columns: max-content max-content;
    align-items: center;
    column-gap: .75rem;
    padding: 10px 7px;
    color: #eee;
    border-radius: .5rem;
    margin-bottom: 1rem;
    transition: .3s;
    cursor: pointer;
    &:hover{
        color: white;
        background-color: ${theme.menu.menuItem.hover || '#00ACC2'};
        text-decoration: none;
    }
    &:focus, &:focus-visible{
        outline: none;
        background-color: ${theme.menu.menuItem.hover || '#00ACC2'};
    }
`};

const SUB_LINK = `
    display: block;
    color: #eee;
    font-size: 16px;
    & :hover{
        color: #eee;
    }
`;

const MainSubLinkStyled = styled(Link)`
    ${SUB_LINK}
    ${({theme}) => getNavLinkStyles(theme)}
    &:hover{
        color: white;
        background-color: unset;
        text-decoration: none;
    }
`;

const SubLinkStyled = styled(Link)`
    ${SUB_LINK}
    &:hover{
        color: white;
        background-color: unset;
        text-decoration: underline;
    }
`;

const LinksStyled = styled.ul`
    margin: 0;
    list-style: none;
    display: ${({isCollapsed}:{isCollapsed: boolean}) => isCollapsed ? 'none' : 'block'};
    padding: .75rem 2.25rem .75rem calc(2.25rem + 10px);
`;

const MenuLinkWithSubLinksStyled = styled.div`
    ${({theme}) => getNavLinkStyles(theme)}
    a{
        padding: 0;
        margin: 0 0 0 5px;
    }
    
    a:focus, a:focus-visible{
        outline: none;
        text-decoration: underline;
    }
    grid-template-columns: 30px max-content 1fr;
`;

const MenuLinkLabelStyled = styled(Text)`
    margin-left: 5px;
`;

const MenuLinkStyled = styled(Link)`
    ${({theme}) => getNavLinkStyles(theme)}
`;

const MenuIconStyled = styled.span`
    vertical-align: text-bottom;
    ${({size}: {size: string | number}) => size ? `width: ${size}px;height: ${size}px;` : '' }
`;

const LogoImageStyled = styled.img`
    width: 2.5rem;
    height: auto;
    margin-left: 4px;
`;

const MenuLinkLogoStyled = styled(Link)<MenuLinkLogoStyled>`
    margin-bottom: 35px !important;
    padding-bottom: 10px;
    &:hover{
        border-bottom: 2px solid ${({theme}) => theme.menu.menuItem.hover || '#00ACC2'};
        padding-bottom: 8px;
    }
    & > span{
        color: #eee;
        font-weight: 600;
        font-size: 20px;
    }
`;

const FoldIconStyled = styled(TooltipButton)`
    justify-self: flex-end;
    transition: all .5s, font-weight 0.1s;
    vertical-align: text-bottom;
    float: right;
    & :hover{
        font-weight: 600;
    }
`

export {
    MainSubLinkStyled,
    SubLinkStyled,
    LinksStyled,
    MenuLinkWithSubLinksStyled,
    MenuLinkLabelStyled,
    MenuLinkStyled,
    MenuIconStyled,
    MenuLinkLogoStyled,
    LogoImageStyled,
    FoldIconStyled,
}