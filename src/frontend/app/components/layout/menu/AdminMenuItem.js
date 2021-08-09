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

import React, { Component }  from 'react';
import {withRouter} from 'react-router';
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";

import {
    addMenuAdminCardsKeyNavigation, removeMenuAdminCardsKeyNavigation,
    addMenuInvokersKeyNavigation, removeMenuInvokersKeyNavigation,
} from "@utils/key_navigation";
import {permission} from "@decorators/permission";
import {
    AppPermissions,
    InvokerPermissions,
    TemplatePermissions,
    UserGroupPermissions,
    UserPermissions
} from "@utils/constants/permissions";
import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/layout/menu.scss";
import {MenuLink, MenuLinkWithSubLinks} from "@components/layout/menu/MenuLink";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Menu Admin
 */
@connect(mapStateToProps, {})
@permission(AppPermissions.READ)
@withTranslation('layout')
class AdminMenuItem extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addMenuAdminCardsKeyNavigation(this);
        addMenuInvokersKeyNavigation(this);
    }

    componentWillUnmount(){
        removeMenuAdminCardsKeyNavigation(this);
        removeMenuInvokersKeyNavigation(this);
    }

    render(){
        const {isMainMenuExpanded} = this.props;
        return(
            <MenuLinkWithSubLinks
                to={'/admin_cards'}
                value={'settings'}
                label={'Admin'}
                subLinks={[
                    {to: '/users', label: 'Users', permission: UserPermissions.READ},
                    {to: '/usergroups', label: 'Groups', permission: UserGroupPermissions.READ},
                    {to: '/apps', label: 'Apps', permission: AppPermissions.READ},
                    {to: '/invokers', label: 'Invokers', permission: InvokerPermissions.READ},
                    {to: '/templates', label: 'Templates', permission: TemplatePermissions.READ},
                ]}
                isMainMenuExpanded={isMainMenuExpanded}
            />
        );
    }
}

AdminMenuItem.defaultProps = {
    isMainMenuExpanded: false,
};

export default withRouter(AdminMenuItem);