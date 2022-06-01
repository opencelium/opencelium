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

import React from "react";
import {LinkProps} from "react-router-dom";
import {LogoImageStyled, MenuLinkLogoStyled} from "./styles";
import {Auth} from "@application/classes/Auth";
import LogoImage from "@app_component/base/logo_image/LogoImage";
import {OC_NAME} from "@application/interfaces/IApplication";

export const MenuLinkLogo = ({isReadonly, onHoverColor, ...props}: Partial<LinkProps> & {isReadonly: boolean, onHoverColor: string}) => {
    const {authUser} = Auth.getReduxState();
    const logoName = authUser.logoName || OC_NAME;
    const time = new Date();
    const logoImageProps = isReadonly ? {} : {update: time};
    return(
        <MenuLinkLogoStyled
            to={isReadonly ? '#' : '/'}
            onHoverColor={onHoverColor}
        >
            <LogoImage style={{marginLeft: '4px'}} {...logoImageProps}/>
            <span>
                <span>{logoName}</span>
            </span>
        </MenuLinkLogoStyled>
    )
}