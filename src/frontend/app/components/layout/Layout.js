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

import React, {Component} from 'react';
import {withTranslation} from "react-i18next";
import { withRouter } from 'react-router';
import {connect} from "react-redux";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import {changeLanguage, fetchAppVersion} from "@actions/app";
import {defaultLanguage} from "@utils/constants/languages";
import {addUserInStore} from '@actions/users/add';

import { addUserListener,
} from '@utils/socket/users';
import LayoutError from "./LayoutError";
import Notification from "../general/app/Notification";
import {NotificationType} from "@utils/constants/notifications/notifications";
import {logoutUserFulfilled, sessionNotExpired} from "@actions/auth";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CAppVoiceControl from "@classes/voice_control/CAppVoiceControl";
import {getLS} from "@utils/LocalStorage";
import {API_REQUEST_STATE, TEST} from "@utils/constants/app";
import {hasHeader} from "@utils/app";

let checkTokenInterval;


function mapStateToProps(state){
    const app = state.get('app');
    const auth = state.get('auth');
    return {
        appVersion: app.get('appVersion'),
        fetchingAppVersion: app.get('fetchingAppVersion'),
        authUser: auth.get('authUser'),
        isAuth: auth.get('isAuth'),
        isSessionExpired: auth.get('isSessionExpired'),
        currentLanguage: auth.get('authUser') ? auth.get('authUser').current_language : defaultLanguage.code,
    };
}

/**
 * Layout of the app(OC)
 */
@withTranslation('notifications')
@connect(mapStateToProps, {changeLanguage, addUserInStore, logoutUserFulfilled, sessionNotExpired, fetchAppVersion})
class Layout extends Component{

    constructor(props){
        super(props);
        this.state = {
            isMenuVisible: false,
            authUser: props.authUser,
            showLoginAgain: false,
        };
    }

    componentDidMount(){
        const {isAuth, addUserInStore, appVersion, fetchAppVersion, fetchingAppVersion} = this.props;
        addUserListener(addUserInStore);
        if(isAuth) {
            CVoiceControl.initCommands({component: this}, CAppVoiceControl);
            if( appVersion === '' && fetchingAppVersion !== API_REQUEST_STATE.START){
                fetchAppVersion();
            }
        }/*
        console.log(TEST.connection.toConnector.methods.map(method => method.index));
        console.log(TEST.connection.toConnector.operators.map(operator => operator.index));*/
    }

    componentDidUpdate(prevProps){
        const {isAuth, sessionNotExpired, appVersion, fetchingAppVersion, fetchAppVersion} = this.props;
        if(prevProps.isSessionExpired && isAuth){
            sessionNotExpired();
        }
        if(isAuth){
            CVoiceControl.initCommands({component: this}, CAppVoiceControl);
            if(appVersion === '' && fetchingAppVersion !== API_REQUEST_STATE.START) {
                fetchAppVersion();
            }
        }
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component: this}, CAppVoiceControl);
    }

    toggleMenu(){
        this.setState({isMenuVisible: !this.state.isMenuVisible});
    }

    hideMenu(){
        this.setState({isMenuVisible: false});
    }

    renderLoginAgain(){
        const {isSessionExpired, sessionNotExpired} = this.props;
        if(location.pathname !== '/login' && isSessionExpired) {
            const {t} = this.props;
            checkTokenInterval = setInterval(() => {
                if(getLS('token')){
                    sessionNotExpired();
                }
            }, 2000);
            const message = <span>Your session is expired, please <a target={'_blank'}
                                                                     href={'/login'}>login</a> again</span>;
            let data = {type: NotificationType.WARNING, message: message, systemTitle: t(`SYSTEMS.OC`)};
            return (
                <div id={'notification'}>
                    <Notification
                        id={'login_again'}
                        data={data}
                        timeOfBeing={'infinite'}
                    />
                </div>
            );
        }
        if(checkTokenInterval) {
            clearInterval(checkTokenInterval);
        }
        return null;
    }

    renderHeader(){
        if(this.props.isAuth && hasHeader(this.props)){
            return <Header toggleMenu={::this.toggleMenu} hideMenu={::this.hideMenu} router={this.props.router}/>;
        }
        return null;
    }

    renderFooter(){
        if(this.props.isAuth){
            return <Footer/>;
        }
    }

    renderLayout(){
        return (
            <div>
                {this.renderHeader()}
                {this.renderLoginAgain()}
                <div>
                    {this.props.children}
                </div>
                {this.renderFooter()}
            </div>
        );
    }
    
    render(){
        return (
            <div>
                <LayoutError>
                    {this.renderLayout()}
                </LayoutError>
            </div>
        );
    }
}

export default withRouter(Layout);