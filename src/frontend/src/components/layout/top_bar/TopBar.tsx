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
import {Application} from "@application/classes/Application";
import {useAppDispatch} from "@application/utils/store";
import Title from "@app_component/layout/top_bar/collection_title/Title";
import ConnectionVersioning from './connection_versioning/ConnectionVersioning';

const TopBar: FC<TopBarProps> =
    ({
         theme,
     }) => {
        const dispatch = useAppDispatch();
        const {authUser} = Auth.getReduxState();
        const {
            onlineServiceStatus, entityHeader,
            isMenuExpanded, isFullScreen,
        } = Application.getReduxState();
        const navigate = useNavigate();
        const isOnline = onlineServiceStatus?.active || false;
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
        console.log(isFullScreen)
        return (
            <TopBarStyled style={{transition: '0.5s', display: 'flex', justifyContent: 'space-between', paddingLeft: `calc(${isFullScreen ? '0px' : isMenuExpanded ? '180px' : '48px'} + 1rem)`, paddingRight: '1rem'}}>
                <div style={{
                    fontFamily: `${theme.text.fontFamily}`,
                    color: `${theme.collectionView.title.color.quite}`,
                    fontSize: '24px'
                }}>
                    {entityHeader ? <Title title={entityHeader}/> : null }
                </div>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center'}}>
                    <ConnectionVersioning theme={theme} />
                    <GlobalSearch/>
                    <NotificationItem/>
                    <Tooltip target={'my_profile'} tooltip={'My Profile'} position={'bottom'} component={MyProfile}/>
                </div>
            </TopBarStyled>
        )
    }

TopBar.defaultProps = {
}


export {
    TopBar,
};

export default withTheme(TopBar);
