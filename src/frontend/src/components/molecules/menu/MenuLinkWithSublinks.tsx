import React, {FC, useEffect, useState} from 'react';
import {LinkProps} from "react-router-dom";
import {
    FoldIconStyled,
    LinksStyled,
    MainSubLinkStyled,
    MenuLinkWithSubLinksStyled,
    SubLinkStyled
} from './styles';
import MenuIcon from "./MenuIcon";
import {IconProps} from "@atom/icon/interfaces";
import {MenuLinkWithSubLinksProps, SubLinkProps} from "./intefaces";
import {ColorTheme} from "../../general/Theme";
import {permission} from "../../../decorators/permission";

const PermissionSubLink = permission<SubLinkProps & React.RefAttributes<HTMLAnchorElement>>(null, false)(SubLinkStyled);

const MenuLinkWithSubLinks: FC<Partial<IconProps> & LinkProps & MenuLinkWithSubLinksProps> =
    ({
        name,
        label,
        to,
        subLinks,
        isMainMenuExpanded,
    }) => {
    const [isCollapsed, collapse] = useState(true);
    useEffect(() => {

    }, []);
    const toggleCollapse = (e: any) => {
        e.preventDefault();
        collapse(!isCollapsed);
    }
    return (
        <MenuLinkWithSubLinksStyled >
            <MenuIcon size={30} name={name} color={ColorTheme.White}/>
            <MainSubLinkStyled tabIndex={-1} key={label} to={to}>{label}</MainSubLinkStyled>
            <FoldIconStyled tabIndex={isMainMenuExpanded ? 0 : -1} hasBackground={false} target={`${label}_main_menu_unfold`} tooltip={isCollapsed ? 'Unfold' : 'Fold'} color={ColorTheme.White} size={18} icon={isCollapsed ? 'expand_more' : 'expand_less'} onClick={(e: any) => toggleCollapse(e)}/>
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

