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
import {addMenuConnectorsKeyNavigation, removeMenuConnectorsKeyNavigation} from "@utils/key_navigation";
import {permission} from "@decorators/permission";
import {ConnectorPermissions} from "@utils/constants/permissions";


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
class ConnectorsMenuItem extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addMenuConnectorsKeyNavigation(this);
    }

    componentWillUnmount(){
        removeMenuConnectorsKeyNavigation(this);
    }

    render(){
        const {t} = this.props;
        return (
            <ListItemLink
                label={{text: t('HEADER.CONNECTORS.TITLE'), index: 0}}
                to='/connectors'
                navigationTitleClass={'tour-step-connector'}
                id={'menu_connectors'}
            />
        );
    }
}

export default withRouter(ConnectorsMenuItem);