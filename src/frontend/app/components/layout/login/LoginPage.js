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

import React, {Component, Suspense} from 'react';
import {connect} from 'react-redux';
import {updateMenu} from "../../../actions/app";
import {AdminMenus, UserMenus} from "../../../utils/constants/menus";
import {Roles} from '../../../utils/constants/app';
import Loading from '../../general/app/Loading';

import {setLS} from "../../../utils/LocalStorage";

import styles from '../../../themes/default/layout/login.scss';
import Login from "./Login";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        isAuth: auth.get('isAuth'),
        authUser: auth.get('authUser'),
        logining: auth.get('logining'),
    };
}

/**
 * Component of Login page
 */
@connect(mapStateToProps, {updateMenu})
class LoginPage extends Component{

    constructor(props){
        super(props);
    }

    componentDidUpdate(){
        if(this.props.isAuth){
            switch(this.props.authUser.role){
                case Roles.USER:
                    setLS("currentMenu", UserMenus['HOME']);
                    this.props.updateMenu(UserMenus.HOME);
                    break;
                case Roles.ADMIN:
                    setLS("currentMenu", AdminMenus['HOME']);
                    this.props.updateMenu(AdminMenus.HOME);
                    break;
            }
            this.props.router.push('/');
        }
    }

    render(){
        const {authUser, logining} = this.props;
        if(logining){
            return <Loading authUser={authUser}/>;
        }
        return (
            <div className={styles.login_page}>
                <Suspense fallback={(<Loading authUser={authUser}/>)}>
                    <Login/>
                </Suspense>
            </div>
        );
    }
}
export default LoginPage;