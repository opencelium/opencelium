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

import React, {FC, useState} from 'react';
import {LinkProps} from "react-router-dom";
import {withTheme} from "styled-components";
import {permission} from "@application/utils/permission";
import {NO_RESTRICTION} from "@application/interfaces/IApplication";
import {IconProps} from "@app_component/base/icon/interfaces";
import Dialog from "@app_component/base/dialog/Dialog";
import {TextSize} from "@app_component/base/text/interfaces";
import Text from "@app_component/base/text/Text";
import {ColorTheme} from "@style/Theme";
import MenuIcon from "./MenuIcon";
import { MenuLinkProps } from './interfaces';
import {MenuLinkLabelStyled, MenuLinkStyled} from './styles';

const MenuLink: FC<MenuLinkProps & LinkProps & IconProps> = permission<MenuLinkProps & LinkProps & IconProps>(null, false)(
    ({
        to,
        onClick,
        name,
        label,
        size,
        hasConfirmation,
        confirmationText,
    }) => {
    const [isConfirmationOpened, toggleConfirmation] = useState<boolean>(false);
    return (
        <MenuLinkStyled
            to={to}
            onClick={hasConfirmation ? () => toggleConfirmation(!isConfirmationOpened) : onClick ? onClick : () => {}}
        >
            <MenuIcon color={ColorTheme.White} name={name} size={size}/>
            <MenuLinkLabelStyled value={label} size={TextSize.Size_16}/>
            {
                hasConfirmation &&
                <Dialog
                    actions={[{label: 'Yes', onClick, id: 'confirmation_yes'},{label: 'No', onClick: () => toggleConfirmation(false), id: 'confirmation_no'}]}
                    active={isConfirmationOpened}
                    toggle={() => toggleConfirmation(!isConfirmationOpened)}
                    title={'Confirmation'}
                >
                    <Text value={confirmationText}/>
                </Dialog>
            }
        </MenuLinkStyled>
    )
})

MenuLink.defaultProps = {
    permission: NO_RESTRICTION,
    hasConfirmation: false,
    confirmationText: '',
}


export {
    MenuLink,
};

export default withTheme(MenuLink);