/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, useEffect, useState} from 'react';
import {LinkProps} from "react-router-dom";
import {permission} from "@application/utils/permission";
import {IconProps} from "@app_component/base/icon/interfaces";
import {ColorTheme} from "@style/Theme";
import {
    FoldIconStyled,
    LinksStyled,
    MainSubLinkStyled,
    MenuLinkWithSubLinksStyled,
    SubLinkStyled
} from './styles';
import MenuIcon from "./MenuIcon";
import {MenuLinkWithSubLinksProps, SubLinkProps} from "./interfaces";

const PermissionSubLink = permission<SubLinkProps & React.RefAttributes<HTMLAnchorElement>>(null, false)(SubLinkStyled);

const MenuLinkWithSubLinks: FC<Partial<IconProps> & LinkProps & MenuLinkWithSubLinksProps> =
    ({
        name,
        label,
        to,
        subLinks,
        isMainMenuExpanded,
        isReadonly,
         onHoverColor,
    }) => {
    const [isCollapsed, collapse] = useState(true);
    useEffect(() => {

    }, []);
    const toggleCollapse = (e: any) => {
        e.preventDefault();
        collapse(!isCollapsed);
    }
    return (
        <MenuLinkWithSubLinksStyled $onHoverColor={onHoverColor}>
            <MenuIcon size={30} name={name} color={ColorTheme.White}/>
            <MainSubLinkStyled tabIndex={-1} key={label} to={isReadonly ? '#' : to}>{label}</MainSubLinkStyled>
            <FoldIconStyled tabIndex={isMainMenuExpanded ? 0 : -1} hasBackground={false} target={`${label}_main_menu_unfold`} tooltip={isCollapsed ? 'Unfold' : 'Fold'} background={ColorTheme.White} size={18} icon={isCollapsed ? 'expand_more' : 'expand_less'} onClick={(e: any) => toggleCollapse(e)}/>
            <LinksStyled isCollapsed={isCollapsed}>
                {subLinks.map(subLink => <PermissionSubLink key={subLink.to.toString()} to={subLink.to} permission={subLink.permission}>{subLink.children}</PermissionSubLink>)}
            </LinksStyled>
        </MenuLinkWithSubLinksStyled>
    )
}

MenuLinkWithSubLinks.defaultProps = {
    isMainMenuExpanded: false,
}


export {
    MenuLinkWithSubLinks,
};

