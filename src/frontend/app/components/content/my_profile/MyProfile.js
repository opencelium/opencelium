/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';

import {fetchUser} from '@actions/users/fetch';
import UserDetails from "./UserDetails";
import UserGroup from "./UserGroup";
import {SingleComponent} from "@decorators/SingleComponent";
import {permission} from "@decorators/permission";
import {MyProfilePermissions} from "@utils/constants/permissions";
import Themes from "./Themes";
import AppTour from "./AppTour";
import ViewComponent from "@components/general/view_component/ViewComponent";


function mapStateToProps(state){
    const users = state.get('users');
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
        user: users.get('user'),
        error: users.get('error'),
        fetchingUser: users.get('fetchingUser'),
    };
}

/**
 * My Profile Component
 */
@connect(mapStateToProps, {fetchUser})
@permission(MyProfilePermissions.READ)
@withTranslation('my_profile')
@SingleComponent('user')
class MyProfile extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, user} = this.props;
        const userGroup = user.userGroups;
        const header = t('HEADER');
        return (
            <ViewComponent header={header} permission={MyProfilePermissions.READ}>
                <UserDetails user={user}/>
                <UserGroup usergroup={userGroup}/>
                <Themes/>
                <AppTour/>
            </ViewComponent>
        );
    }
}

export default MyProfile;