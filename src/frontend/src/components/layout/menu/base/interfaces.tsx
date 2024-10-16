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

import {LinkProps} from "react-router-dom";
import { PermissionProps } from "@application/interfaces/IApplication";
import {ITheme} from "@style/Theme";
import * as React from "react";

interface MenuLinkProps{
    component?: any,
    theme?: ITheme,
    permission?: PermissionProps,
    label?: string,
    hasConfirmation?: boolean,
    confirmationText?: string,
    isReadonly?: boolean,
    onHoverColor?: string,
}

interface MenuLinkLogoProps extends Partial<LinkProps>{
    isReadonly: boolean,
    $onHoverColor: string,
}

interface SubLinkProps extends LinkProps{
    permission?: PermissionProps,
}

interface MenuLinkWithSubLinksProps{
    label?: string,
    subLinks: SubLinkProps[],
    isMainMenuExpanded?: boolean,
    onHoverColor?: string,
    isReadonly?: boolean,
}

interface MenuLinkStyledProps extends Partial<LinkProps>{
    $onHoverColor?: string,
}

export {
    SubLinkProps,
    MenuLinkLogoProps,
    MenuLinkWithSubLinksProps,
    MenuLinkProps,
    MenuLinkStyledProps,
}
