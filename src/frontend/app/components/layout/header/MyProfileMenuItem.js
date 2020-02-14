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
addMenuMyProfileKeyNavigation, removeMenuMyProfileKeyNavigation,
} from "../../../utils/key_navigation";
import {permission} from "../../../decorators/permission";
import {MyProfilePermissions} from "../../../utils/constants/permissions";


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
@permission(MyProfilePermissions.READ)
class MyProfileMenuItem extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addMenuMyProfileKeyNavigation(this);
    }

    componentWillUnmount(){
        removeMenuMyProfileKeyNavigation(this);
    }

    render(){
        return (
            <ListItemLink
                label={{text: '', index: 3}}
                tooltip={'My Profile'}
                to='/myprofile'
                icon='face'
                style={{paddingRight: '30px', height: '40px', paddingTop: '8px'}}
                className={'tour-step-myprofile'}
            />
        );
    }
}

export default withRouter(MyProfileMenuItem);