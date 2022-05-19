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

import {LinkProps} from "react-router-dom";
import { PermissionProps } from "@application/interfaces/IApplication";
import {ITheme} from "@style/Theme";

interface MenuLinkProps{
    theme?: ITheme,
    permission?: PermissionProps,
    label?: string,
    hasConfirmation?: boolean,
    confirmationText?: string,
}


interface SubLinkProps extends LinkProps{
    permission?: PermissionProps,
}

interface MenuLinkWithSubLinksProps{
    label?: string,
    subLinks: SubLinkProps[],
    isMainMenuExpanded?: boolean,
}

interface MenuLinkLogoStyled{
    theme?: ITheme,
}

export {
    SubLinkProps,
    MenuLinkWithSubLinksProps,
    MenuLinkProps,
    MenuLinkLogoStyled,
}
