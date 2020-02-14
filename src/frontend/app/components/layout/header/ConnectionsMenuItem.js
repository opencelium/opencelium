/*
 * Copyright (C) <2019>  <becon GmbH>
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
import {withTranslation} from 'react-i18next';
import ListItemLink from "../../general/basic_components/ListItemLink";

import {addMenuConnectionsKeyNavigation, removeMenuConnectionsKeyNavigation} from "../../../utils/key_navigation";
import {permission} from "../../../decorators/permission";
import {ConnectionPermissions} from "../../../utils/constants/permissions";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Menu Item for Connections
 */
@connect(mapStateToProps, {})
@permission(ConnectionPermissions.READ)
@withTranslation('connections')
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
        const {t} = this.props;
        return (
            <ListItemLink
                label={{text: t('MENU.TITLE'), index: 2}}
                to='/connections'
                navigationTitleClass={'tour-step-connection'}
            />
        );
    }
}

export default withRouter(ConnectionsMenuItem);