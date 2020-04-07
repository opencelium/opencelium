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

import React, { Component } from 'react';
import {connect} from 'react-redux';
import Loading from "../components/general/app/Loading";

import {API_REQUEST_STATE} from "../utils/constants/app";
import {history} from "../components/App";
import {checkOCConnection} from "../actions/auth";
import {logoutUserFulfilled} from "../actions/auth";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
        checkingOCConnection: auth.get('checkingOCConnection'),
        error: auth.get('error'),
        logining: auth.get('logining'),
        logouting: auth.get('logouting'),
    };
}
/**
 * common component for checking OC Connection
 *
 * returns the same component
 * @constructor
 */
export function checkConnection(){
    return function (Component) {
        return (
            @connect(mapStateToProps, {checkOCConnection, logoutUserFulfilled})
            class C extends Component {
                constructor(props) {
                    super(props);

                    this.state = {
                        checkedOnce: false,
                    };
                }

                componentDidMount() {
                    //this.checkOCConnection();
                }
/*
                componentDidUpdate() {
                    const {checkingOCConnection, error, logoutUserFulfilled} = this.props;
                    if (checkingOCConnection === API_REQUEST_STATE.FINISH) {
                        if(!this.state.checkedOnce){
                            this.setState({checkedOnce: true});
                        }
                        if (error !== null) {
                            logoutUserFulfilled({});
                            history.push('/login');
                        }
                    }
                }*/

                checkOCConnection() {
                    this.props.checkOCConnection();
                }

                render() {
                    const {authUser, logining, logouting} = this.props;
                    let isCheckingConnection = !this.state.checkedOnce;
                    if (logining || logouting/* || isCheckingConnection*/){
                        return (
                            <div style={{padding: '0 15px', maxWidth: '1140px', marginLeft: 'auto', marginRight: 'auto'}}>
                                <Loading authUser={authUser}/>
                            </div>
                        );
                    }
                    return <Component {...this.props}/>;
                }
            }
        );
    };
}

export default checkConnection;