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

import React from "react";
import {LinkProps} from "react-router-dom";
import {LogoImageStyled, MenuLinkLogoStyled} from "./styles";
import LogoOcWhiteImagePath from "@image/application/logo_oc_white.png";

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