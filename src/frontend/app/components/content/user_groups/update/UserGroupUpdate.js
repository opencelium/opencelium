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

import {updateUserGroup} from '@actions/usergroups/update';
import {fetchUserGroup, checkUserGroupName} from '@actions/usergroups/fetch';
import {fetchComponents} from '@actions/components/fetch';
import {SingleComponent} from "@decorators/SingleComponent";
import {permission} from "@decorators/permission";
import {UserGroupPermissions} from "@utils/constants/permissions";
import {UserGroupChange} from "@components/content/user_groups/UserGroupChange";

function mapStateToProps(state){
    const auth = state.get('auth');
    const components = state.get('components');
    const userGroups = state.get('userGroups');
    return{
        authUser: auth.get('authUser'),
        userGroup: userGroups.get('userGroup'),
        error: userGroups.get('error'),
        fetchingUserGroup: userGroups.get('fetchingUserGroup'),
        updatingUserGroup: userGroups.get('updatingUserGroup'),
        checkingUserGroupName: userGroups.get('checkingUserGroupName'),
        checkNameResult: userGroups.get('checkNameResult'),
        fetchingComponents: components.get('fetchingComponents'),
        components: components.get('components').toJS(),
    };
}

function mapUserGroup(userGroup){
    let mappedUserGroup = {};
    mappedUserGroup.id = userGroup.id;
    mappedUserGroup.name = userGroup.role;
    mappedUserGroup.description = userGroup.description;
    mappedUserGroup.icon = userGroup.icon;
    mappedUserGroup.shouldDeleteImage = userGroup.shouldDeleteImage;
    mappedUserGroup.components = userGroup.components.map((component) => {
        return {componentId: component.value, permissions: userGroup.permissions[component.label]};
    });
    return mappedUserGroup;
}

/**
 * Component to Update UserGroup
 */
@connect(mapStateToProps, {fetchUserGroup, fetchComponents, updateUserGroup, checkUserGroupName})
@permission(UserGroupPermissions.UPDATE, true)
@withTranslation(['userGroups', 'app'])
@SingleComponent('userGroup', 'updating', ['components'], mapUserGroup)
@UserGroupChange('update')
class UserGroupUpdate extends Component{}

export default UserGroupUpdate;