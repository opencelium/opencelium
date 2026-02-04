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

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {createGlobalStyle} from "styled-components";
import {resizeWindow} from "@application/utils/utils";
import {Application} from "@application/classes/Application";
import Button from "@app_component/base/button/Button";
import Tooltip from "@app_component/base/tooltip/Tooltip";
import {MenuLinkLogo} from "@entity/application/components/menu_link_logo/MenuLinkLogo";
import {ColorTheme} from "@style/Theme";
import { MenuProps } from './interfaces';
import {MenuStyled, MenuTop, NavStyled} from './styles';
import {LogoutMenuItem} from "./LogoutMenuItem";
import {getMenuItems} from "@entity/index";
import {toggleMenu} from "@application/redux_toolkit/slices/ApplicationSlice";
import {useAppDispatch} from "@application/utils/store";

const Global = createGlobalStyle`
    body{
        padding: 2rem 1rem 0 calc(48px + 1rem);
    }
`;

const Menu: FC<MenuProps> =
    ({
         isPreview,
         isReadonly,
         background,
         hoverMenuItemBackground,
    }) => {
    const dispatch = useAppDispatch();
    const {isFullScreen, isMenuExpanded} = Application.getReduxState();
    const [isMouseOver, toggleMouseOver] = useState(false);
    const onMouseOver = () => {
        if(!isReadonly) {
            toggleMouseOver(true);
        }
    }
    const onMouseLeave = () => {
        if(!isReadonly) {
            toggleMouseOver(false);
        }
    }
    useEffect(() => {
        setTimeout(() => resizeWindow(), 500);
    },[isMenuExpanded]);
    useEffect(() => {
        const bodyElement = document.querySelector('body');
        if (bodyElement) {
            if(isFullScreen){
                bodyElement.style['padding'] = '0 1rem 2rem';
            } else{
                bodyElement.style['padding'] = '0 1rem 0 calc(48px + 1rem)';
            }
        }
    }, [isFullScreen])
    useEffect(() => {
        return () => {
            const bodyElement = document.querySelector('body');
            if (bodyElement) {
                bodyElement.style['padding'] = '0 1rem 0 calc(48px + 1rem)';
            }
        }
    }, [])
    const toggle = () => {
        if(!isReadonly) {
            dispatch(toggleMenu(!isMenuExpanded));
            let bodyElement = document.querySelector('body');
            if (bodyElement) {
                if (!isMenuExpanded) {
                    bodyElement.style['padding'] = '0 1rem 0 calc(180px + 1rem)';
                } else {
                    bodyElement.style['padding'] = '0 1rem 0 calc(48px + 1rem)';
                }
            }
        }
    }

    let showMenu = isMouseOver ? true : isMenuExpanded;
    return (
        <React.Fragment>
            <Global/>
            <MenuStyled background={background} isPreview={isPreview} isFullScreen={isFullScreen} isExpanded={showMenu} onMouseOver={(e) => onMouseOver()} onMouseLeave={(e) => onMouseLeave()}>
                <NavStyled>
                    <div>
                        <MenuTop>
                            <MenuLinkLogo to={'/'} isReadonly={isReadonly} $onHoverColor={hoverMenuItemBackground}/>
                            <Tooltip target={'menu_burger_icon'} tooltip={isMenuExpanded ? 'Constrict' : 'Expand'} component={
                                <Button margin={'12px 8.5px'} id={'menu_burger_icon'} iconSize={'30px'} handleClick={toggle} hasBackground={false} icon={isMenuExpanded ? 'menu_open' : 'menu'} background={ColorTheme.White}/>}
                            />
                        </MenuTop>
                        <div>
                            {getMenuItems({showMenu, isReadonly, onHoverColor: hoverMenuItemBackground})}
                        </div>
                    </div>
                    {!isReadonly && <LogoutMenuItem isReadonly={isReadonly} onHoverColor={hoverMenuItemBackground}/>}
                </NavStyled>
            </MenuStyled>
        </React.Fragment>
    )
}

Menu.defaultProps = {
    isPreview: false,
    isReadonly: false,
    hoverMenuItemBackground: '',
    background: '',
}


export {
    Menu,
};

export default withTheme(Menu);
