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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { TopBarProps } from './interfaces';
import { TopBarStyled } from './styles';
import NotificationItem from "@organism/top_bar/NotificationItem";
import TooltipButton from "@molecule/tooltip_button/TooltipButton";
import {ColorTheme} from "../../general/Theme";
import {GlobalSearch} from "@organism/top_bar/GlobalSearch";

const TopBar: FC<TopBarProps> =
    ({

    }) => {
    return (
        <TopBarStyled >
            <GlobalSearch/>
            <NotificationItem/>
            <TooltipButton href={'/profile'} size={24} target={`button_my_profile`} tooltip={'My Profile'} icon={'face'} position={'bottom'} color={ColorTheme.Black} hasBackground={false}/>
        </TopBarStyled>
    )
}

TopBar.defaultProps = {
}


export {
    TopBar,
};

export default withTheme(TopBar);