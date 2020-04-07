/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, { Component }  from 'react';
import {withRouter} from 'react-router';
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";

import ListItemLink from "../../general/basic_components/ListItemLink";
import {addMenuUserGroupsKeyNavigation, removeMenuUserGroupsKeyNavigation} from "../../../utils/key_navigation";
import {permission} from "../../../decorators/permission";
import {UserGroupPermissions} from "../../../utils/constants/permissions";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Menu UserGroups
 */
@connect(mapStateToProps, {})
@permission(UserGroupPermissions.READ)
@withTranslation('layout')
class UserGroupsMenuItem extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addMenuUserGroupsKeyNavigation(this);
    }

    componentWillUnmount(){
        removeMenuUserGroupsKeyNavigation(this);
    }

    render(){
        const {t} = this.props;
        return (
            <ListItemLink
                label={{text: t('HEADER.USER_GROUPS.TITLE'), index: 0}}
                to='/usergroups'
                navigationTitleClass={'tour-step-usergroup'}
                id={'menu_user_groups'}
            />
        );
    }
}

export default withRouter(UserGroupsMenuItem);