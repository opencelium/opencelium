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

import Loading from '../../general/app/Loading';
import Login from "./Login";

import styles from '../../../themes/default/layout/login.scss';


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        isAuth: auth.get('isAuth'),
        authUser: auth.get('authUser'),
        logining: auth.get('logining'),
    };
}

/**
 * App Login Page
 */
@connect(mapStateToProps, {})
class LoginPage extends Component{

    constructor(props){
        super(props);
    }

    componentDidUpdate(){
        const {isAuth, router} = this.props;
        if(isAuth){
            router.push('/');
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