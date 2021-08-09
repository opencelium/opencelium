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
import {withRouter, Link} from 'react-router';
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";

import {
    addMenuConnectionsKeyNavigation, removeMenuConnectionsKeyNavigation,
} from "@utils/key_navigation";
import {permission} from "@decorators/permission";
import {ConnectionPermissions} from "@utils/constants/permissions";
import {MenuLink} from "@components/layout/menu/MenuLink";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Menu Connectors
 */
@connect(mapStateToProps, {})
@permission(ConnectionPermissions.READ)
@withTranslation('layout')
class ConnectionsMenuItem extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addMenuConnectionsKeyNavigation(this);
    }

    componentWillUnmount(){
        removeMenuConnectionsKeyNavigation(this);
    }

    render(){
        return(
            <MenuLink
                to={'/connections'}
                value={'sync_alt'}
                label={'Connections'}
            />
        );
    }
}

export default withRouter(ConnectionsMenuItem);