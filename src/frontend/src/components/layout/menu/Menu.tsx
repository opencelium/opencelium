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
import {withTheme} from 'styled-components';
import {createGlobalStyle} from "styled-components";
import {isReactComponent, resizeWindow} from "@application/utils/utils";
import {Application} from "@application/classes/Application";
import Button from "@app_component/base/button/Button";
import Tooltip from "@app_component/base/tooltip/Tooltip";
import {MenuLinkLogo} from "./base/MenuLinkLogo";
import {ColorTheme} from "@style/Theme";
import { MenuProps } from './interfaces';
import {MenuStyled, MenuTop, NavStyled} from './styles';
import {LogoutMenuItem} from "./LogoutMenuItem";
import {getMenuItems} from "@entity/index";


const Global = createGlobalStyle`
    body{
        padding: 2rem 2rem 0 calc(95px + 2rem);
    }
`;

const Menu: FC<MenuProps> =
    ({
        isPreview,
        isReadonly,
        background,
        hoverMenuItemBackground,
    }) => {
    const {isFullScreen} = Application.getReduxState();
    const [isExpanded, toggleExpanded] = useState(false);
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
    },[isExpanded]);
    useEffect(() => {
        const bodyElement = document.querySelector('body');
        if (bodyElement) {
            if(isFullScreen){
                bodyElement.style['padding'] = '2rem';
            } else{
                bodyElement.style['padding'] = '2rem 2rem 0 calc(95px + 2rem)';
            }
        }
    }, [isFullScreen])
    useEffect(() => {
        return () => {
            const bodyElement = document.querySelector('body');
            if (bodyElement) {
                bodyElement.style['padding'] = '2rem 2rem 0 calc(95px + 2rem)';
            }
        }
    }, [])
    const toggle = () => {
        if(!isReadonly) {
            toggleExpanded(!isExpanded);
            let bodyElement = document.querySelector('body');
            if (bodyElement) {
                if (!isExpanded) {
                    bodyElement.style['padding'] = '2rem 2rem 0 17rem';
                } else {
                    bodyElement.style['padding'] = '2rem 2rem 0 calc(95px + 2rem)';
                }
            }
        }
    }

    let showMenu = isMouseOver ? true : isExpanded;
    return (
        <React.Fragment>
            <Global/>
            <MenuStyled background={background} isPreview={isPreview} isFullScreen={isFullScreen} isExpanded={showMenu} onMouseOver={(e) => onMouseOver()} onMouseLeave={(e) => onMouseLeave()}>
                <NavStyled>
                    <div>
                        <MenuTop>
                            <MenuLinkLogo isReadonly={isReadonly} onHoverColor={hoverMenuItemBackground}/>
                            <Tooltip target={'menu_burger_icon'} tooltip={isExpanded ? 'Constrict' : 'Expand'} component={
                                <Button margin={'12px 8.5px'} id={'menu_burger_icon'} iconSize={'30px'} handleClick={toggle} hasBackground={false} icon={isExpanded ? 'menu_open' : 'menu'} background={ColorTheme.White}/>}
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