import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import { MenuProps } from './interfaces';
import {MenuStyled, MenuTop, NavStyled} from './styles';
import {ConnectionsMenuItem} from "./ConnectionsMenuItem";
import {SchedulesMenuItem} from "./SchedulesMenuItem";
import {AdminMenuItem} from "./AdminMenuItem";
import {LogoutMenuItem} from "./LogoutMenuItem";
import {MenuLinkLogo} from "@molecule/menu/MenuLinkLogo";
import {ColorTheme} from "../../general/Theme";
import {ConnectorsMenuItem} from "./ConnectorsMenuItem";
import Button from "../../atoms/button/Button";
import Tooltip from "../../atoms/tooltip/Tooltip";
import {useAppDispatch} from "../../../hooks/redux";
import {createGlobalStyle} from "styled-components";
import {resizeWindow} from "../../../utils";


const Global = createGlobalStyle`
    body{
        padding: 2rem 2rem 0 calc(95px + 2rem);
    }
`;

const Menu: FC<MenuProps> =
    ({

    }) => {
    const dispatch = useAppDispatch();
    const [isExpanded, toggleExpanded] = useState(false);
    const [isMouseOver, toggleMouseOver] = useState(false);
    const onMouseOver = () => {
        toggleMouseOver(true);
    }
    const onMouseLeave = () => {
        toggleMouseOver(false);
    }
    useEffect(() => {
        setTimeout(() => resizeWindow(), 500);
    },[isExpanded]);
    const toggle = () => {
        toggleExpanded(!isExpanded);
        let bodyElement = document.querySelector('body');
        if(bodyElement) {
            if(!isExpanded){
                bodyElement.style['padding'] = '2rem 2rem 0 17rem';
            } else{
                bodyElement.style['padding'] = '2rem 2rem 0 calc(95px + 2rem)';
            }
        }
    }

    let showMenu = isMouseOver ? true : isExpanded;
    return (
        <React.Fragment>
            <Global/>
            <MenuStyled isExpanded={showMenu} onMouseOver={(e) => onMouseOver()} onMouseLeave={(e) => onMouseLeave()}>
                <NavStyled>
                    <div>
                        <MenuTop>
                            <MenuLinkLogo/>
                            <Tooltip target={'menu_burger_icon'} tooltip={isExpanded ? 'Constrict' : 'Expand'} component={
                                <Button margin={'12px 8.5px'} id={'menu_burger_icon'} iconSize={'30px'} handleClick={toggle} hasBackground={false} icon={isExpanded ? 'menu_open' : 'menu'} color={ColorTheme.White}/>}
                            />
                        </MenuTop>
                        <div>
                            <ConnectorsMenuItem/>
                            <ConnectionsMenuItem/>
                            <SchedulesMenuItem/>
                            <AdminMenuItem isMainMenuExpanded={showMenu}/>
                        </div>
                    </div>
                    <LogoutMenuItem/>
                </NavStyled>
            </MenuStyled>
        </React.Fragment>
    )
}

Menu.defaultProps = {
}


export {
    Menu,
};

export default withTheme(Menu);