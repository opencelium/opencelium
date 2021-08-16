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
import {SingleComponent} from "@decorators/SingleComponent";
import {permission} from "@decorators/permission";
import {UserPermissions} from "@utils/constants/permissions";
import {UserForm} from "@components/content/users/UserForm";



function mapStateToProps(state){
    const auth = state.get('auth');
    const users = state.get('users');
    return{
        authUser: auth.get('authUser'),
        user: users.get('user'),
        error: users.get('error'),
        fetchingUser: users.get('fetchingUser')
    };
}

/**
 * Component to View User
 */
@connect(mapStateToProps, {fetchUser})
@permission(UserPermissions.READ, true)
@withTranslation('users')
@SingleComponent('user')
@UserForm('view')
class UserView extends Component{}

export default UserView;