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
import {fetchUserGroup} from '@actions/usergroups/fetch';
import { Row, Col, Visible, Hidden } from "react-grid-system";
import {SingleComponent} from "@decorators/SingleComponent";
import {Permissions} from '@utils/constants/app';
import styles from '@themes/default/content/user_groups/view.scss';
import {UserGroupPermissions} from '@utils/constants/permissions';
import UserGroupIcon from "../../../icons/UserGroupIcon";
import {permission} from "@decorators/permission";
import {getThemeClass} from "@utils/app";
import Table from "@basic_components/table/Table";
import ViewComponent from "@components/general/view_component/ViewComponent";
import {UserGroupForm} from "@components/content/user_groups/UserGroupForm";


const prefixUrl = '/usergroups';

function mapStateToProps(state){
    const auth = state.get('auth');
    const userGroups = state.get('userGroups');
    return{
        authUser: auth.get('authUser'),
        userGroup: userGroups.get('userGroup'),
        error: userGroups.get('error'),
        fetchingUserGroup: userGroups.get('fetchingUserGroup')
    };
}

/**
 * Component to View UserGroup
 */
@connect(mapStateToProps, {fetchUserGroup})
@permission(UserGroupPermissions.READ, true)
@withTranslation(['userGroups', 'app'])
@SingleComponent('userGroup')
@UserGroupForm('view')
class UserGroupView extends Component{}

export default UserGroupView;