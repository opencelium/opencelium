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

import React from 'react';
import {TooltipProps} from "reactstrap";
import Icon from "@app_component/base/icon/Icon";
import {IconProps} from "@app_component/base/icon/interfaces";
import Tooltip from "@app_component/base/tooltip/Tooltip";
import {MenuIconStyled} from "./styles";

export const MenuIcon = (props: IconProps & Partial<TooltipProps>) => {
    if(props.tooltip){
        let id = `menu_icon_${props.name}`;
        return(
            <Tooltip target={id} tooltip={props.tooltip} component={
                <MenuIconStyled size={props.size}>
                    <Icon id={id} {...props}/>
                </MenuIconStyled>
            }/>
        );
    } else{
        return(
            <MenuIconStyled size={props.size}>
                <Icon {...props}/>
            </MenuIconStyled>
        );
    }
}

export default MenuIcon;