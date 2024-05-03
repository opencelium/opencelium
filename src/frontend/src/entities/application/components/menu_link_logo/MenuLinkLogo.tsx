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

import React, {useEffect} from "react";
import {MenuLinkLogoStyled} from "./styles";
import {Auth} from "@application/classes/Auth";
import {OC_NAME} from "@application/interfaces/IApplication";
import {Application} from "@application/classes/Application";
import {getLogoName, getVersion} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import {useAppDispatch} from "@application/utils/store";
import {MenuLinkLogoProps} from "@app_component/layout/menu/base/interfaces";
import LogoImage from "./LogoImage";

export const MenuLinkLogo = ({isReadonly, $onHoverColor, to}: MenuLinkLogoProps) => {
    const dispatch = useAppDispatch();
    const {authUser} = Auth.getReduxState();
    const {logoDataStatus, version} = Application.getReduxState();
    const logoName = authUser?.userDetail?.themeSync ? authUser.logoName || OC_NAME : OC_NAME;
    const time = new Date();
    const logoImageProps = isReadonly ? {} : {update: time};
    useEffect(() => {
        if(authUser.userDetail.themeSync){
            dispatch(getLogoName(authUser.email));
        }
    }, [logoDataStatus, authUser.userDetail.themeSync])
    useEffect(() => {
        dispatch(getVersion());
    }, []);
    return(
        <MenuLinkLogoStyled
            title={`${OC_NAME} v${version}`}
            to={isReadonly ? '#' : to}
            $onHoverColor={$onHoverColor}
        >
            <LogoImage style={{marginLeft: '4px'}} {...logoImageProps}/>
            <span>
                <span>{logoName}</span>
            </span>
        </MenuLinkLogoStyled>
    )
}
