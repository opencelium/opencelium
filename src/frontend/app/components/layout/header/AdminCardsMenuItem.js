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

import ListItemLink from "@basic_components/ListItemLink";
import {
    addMenuAdminCardsKeyNavigation, removeMenuAdminCardsKeyNavigation,
    addMenuInvokersKeyNavigation, removeMenuInvokersKeyNavigation,
} from "@utils/key_navigation";
import {permission} from "@decorators/permission";
import {AppPermissions} from "@utils/constants/permissions";


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
class AdminCardsMenuItem extends Component{

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
        const {t} = this.props;
        return (
            <ListItemLink
                label={{text: t('HEADER.ADMIN.TITLE'), index: 0}}
                to='/admin_cards'
                navigationTitleClass={'tour-step-app'}
                id={'menu_admin'}
            />
        );
    }
}

export default withRouter(AdminCardsMenuItem);