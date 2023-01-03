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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { TopBarProps } from './interfaces';
import { TopBarStyled } from './styles';
import NotificationItem from "./NotificationItem";
import {GlobalSearch} from "./GlobalSearch";
import Gravatar from 'react-gravatar';
import {useNavigate} from "react-router";
import Tooltip from "@app_component/base/tooltip/Tooltip";
import {Auth} from "@application/classes/Auth";
import AvatarDefault from "@image/application/avatar_default.png";

const TopBar: FC<TopBarProps> =
    ({
         theme,
     }) => {
        const {authUser} = Auth.getReduxState();
        const navigate = useNavigate();
        const isOnline = authUser?.userDetail?.themeSync || false;
        const MyProfile = isOnline ?
            <Gravatar
                id={'my_profile'}
                email={authUser.email}
                size={50}
                rating="pg"
                default="mm"
                title={'My Profile'}
                style={{cursor: 'pointer', borderRadius: '50%', border: `1px solid ${theme.menu.background}`}}
                protocol="https://"
                onClick={() => navigate('/profile', {replace: false})}
            />
            :
            <img
                id={'my_profile'}
                alt={'My Profile'}
                src={AvatarDefault}
                style={{width: '50px', height: '50px', cursor: 'pointer', borderRadius: '50%', border: `1px solid ${theme.menu.background}`}}
                onClick={() => navigate('/profile', {replace: false})}
            />;
        return (
            <TopBarStyled >
                <GlobalSearch/>
                <NotificationItem/>
                <Tooltip target={'my_profile'} tooltip={'My Profile'} position={'bottom'} component={MyProfile}/>
            </TopBarStyled>
        )
    }

TopBar.defaultProps = {
}


export {
    TopBar,
};

export default withTheme(TopBar);