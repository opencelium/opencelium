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
    addMenuConnectionsKeyNavigation,
    addMenuConnectorsKeyNavigation, removeMenuConnectionsKeyNavigation,
    removeMenuConnectorsKeyNavigation
} from "@utils/key_navigation";
import {permission} from "@decorators/permission";
import {ConnectorPermissions} from "@utils/constants/permissions";
import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/layout/menu.scss";
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
@permission(ConnectorPermissions.READ)
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
                value={'share'}
                label={'Connections'}
            />
        );
    }
}

export default withRouter(ConnectionsMenuItem);