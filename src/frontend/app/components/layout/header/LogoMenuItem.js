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
import ListItemLink from "../../general/basic_components/ListItemLink";

import {
    addMenuDashboardKeyNavigation, removeMenuDashboardKeyNavigation,
} from "../../../utils/key_navigation";



function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Menu Item for MyProfile
 */
@connect(mapStateToProps, {})
class LogoMenuItem extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addMenuDashboardKeyNavigation(this);
    }

    componentWillUnmount(){
        removeMenuDashboardKeyNavigation(this);
    }

    render(){
        return (
            <ListItemLink
                label={{text: '', index: 0}}
                to='/'
                tooltip={'Home'}
                icon={<img src={'../../../img/logo.png'} width={'44px'} style={{cursor: 'pointer'}}/>}
                style={{padding: '0', height: '40px'}}
                className={'tour-step-dashboard'}
            />
        );
    }
}

export default withRouter(LogoMenuItem);