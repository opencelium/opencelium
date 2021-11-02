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

import {fetchUser, checkUserEmail} from '@actions/users/fetch';
import {updateUser} from '@actions/users/update';
import {fetchUserGroups} from '@actions/usergroups/fetch';
import {permission} from "@decorators/permission";
import {UserPermissions} from "@utils/constants/permissions";
import {SingleComponent} from "@decorators/SingleComponent";
import {UserForm} from "@components/content/users/UserForm";


function mapStateToProps(state){
    const auth = state.get('auth');
    const users = state.get('users');
    const userGroups = state.get('userGroups');
    return{
        authUser: auth.get('authUser'),
        error: users.get('error'),
        userGroups: userGroups.get('userGroups').toJS(),
        fetchingUserGroups: userGroups.get('fetchingUserGroups'),
        checkingUserEmail: users.get('checkingUserEmail'),
        checkEmailResult: users.get('checkEmailResult'),
        updatingUser: users.get('updatingUser'),
        user: users.get('user'),
        fetchingUser: users.get('fetchingUser'),
    };
}

/**
 * to map data before updating
 */
function mapUser(user){
    let updatedUser = {};
    updatedUser.id = user.id;
    updatedUser.email = user.email;
    updatedUser.password = user.password;
    updatedUser.repeatPassword = user.repeatPassword;
    updatedUser.userGroup = user.userGroup;
    updatedUser.userDetail = {};
    updatedUser.userDetail.name = user.name;
    updatedUser.userDetail.surname = user.surname;
    updatedUser.userDetail.phoneNumber = user.phoneNumber;
    updatedUser.userDetail.organisation = user.organisation;
    updatedUser.userDetail.department = user.department;
    updatedUser.userDetail.userTitle = user.userTitle;
    updatedUser.userDetail.profilePicture = user.profilePicture;
    updatedUser.userDetail.bitbucketUser = user.bitbucketUser;
    updatedUser.userDetail.bitbucketPassword = user.bitbucketPassword;

    return updatedUser;
}


/**
 * Component to Update User
 */
@connect(mapStateToProps, {updateUser, fetchUser, fetchUserGroups, checkUserEmail})
@permission(UserPermissions.UPDATE, true)
@withTranslation(['users', 'app'])
@SingleComponent('user', 'updating', ['userGroups'], mapUser)
@UserForm('update')
class UserUpdate extends Component{}

export default UserUpdate;