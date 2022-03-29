import React from "react";
import {LinkProps} from "react-router-dom";
import {LogoImageStyled, MenuLinkLogoStyled} from "./styles";
import LogoOcWhiteImagePath from "@images/logo_oc_white.png";

export const MenuLinkLogo = (props: Partial<LinkProps>) => {
    return(
        <MenuLinkLogoStyled
            to={'/'}
        >
            <LogoImageStyled src={LogoOcWhiteImagePath} alt={'OpenCelium'}/>
            <span>
                <span>{'OpenCelium'}</span>
            </span>
        </MenuLinkLogoStyled>
    )
}