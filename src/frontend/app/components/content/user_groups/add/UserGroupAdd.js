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

import {addUserGroup} from '@actions/usergroups/add';
import {checkUserGroupName} from "@actions/usergroups/fetch";
import {fetchComponents} from '@actions/components/fetch';
import {permission} from "@decorators/permission";
import {UserGroupPermissions} from "@utils/constants/permissions";
import {SingleComponent} from "@decorators/SingleComponent";
import {UserGroupForm} from "@components/content/user_groups/UserGroupForm";


/**
 * to add usergroup
 */
function mapUserGroup(userGroup){
    let mappedUserGroup = {};
    mappedUserGroup.name = userGroup.role;
    mappedUserGroup.description = userGroup.description;
    mappedUserGroup.icon = userGroup.icon;
    mappedUserGroup.components = userGroup.components.map((component) => {
        return {componentId: component.value, permissions: userGroup.permissions[component.label]};
    });
    return mappedUserGroup;
}

function mapStateToProps(state){
    const auth = state.get('auth');
    const userGroups = state.get('userGroups');
    const components = state.get('components');
    return{
        authUser: auth.get('authUser'),
        addingUserGroup: userGroups.get('addingUserGroup'),
        error: userGroups.get('error'),
        checkingUserGroupName: userGroups.get('checkingUserGroupName'),
        checkNameResult: userGroups.get('checkNameResult'),
        fetchingComponents: components.get('fetchingComponents'),
        components: components.get('components').toJS(),
    };
}

/**
 * Component to Add User Group
 */
@connect(mapStateToProps, {addUserGroup, fetchComponents, checkUserGroupName})
@permission(UserGroupPermissions.CREATE, true)
@withTranslation(['userGroups', 'app'])
@SingleComponent('userGroup', 'adding', ['components'], mapUserGroup)
@UserGroupForm('add')
class UserGroupAdd extends Component{}

export default UserGroupAdd;