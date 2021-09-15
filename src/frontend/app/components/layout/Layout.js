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
import {getCryptLS, getLS} from "@utils/LocalStorage";
import {API_REQUEST_STATE, TEST} from "@utils/constants/app";
import {hasHeader} from "@utils/app";
import Menu from "@components/layout/menu/Menu";
import TopBar from "@components/layout/header/TopBar";
import NotificationPanel from "@components/layout/notification/NotificationPanel";

let checkTokenInterval;


function mapStateToProps(state){
    const app = state.get('app');
    const auth = state.get('auth');
    return {
        appVersion: app.get('appVersion'),
        isComponentExternalInChangeContent: app.get('isComponentExternalInChangeContent'),
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
        }
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
                if(getCryptLS('token')){
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
        const {isAuth, router} = this.props;
        if(!isAuth){
            return <TopBar/>;
        }
        return (
            <div id={'app_header'}>
                {hasHeader(this.props) && <Menu toggleMenu={::this.toggleMenu} hideMenu={::this.hideMenu} router={router}/>}
                <TopBar/>
            </div>
        );
    }

    renderLayout(){
        return (
            <div>
                {this.renderHeader()}
                {this.renderLoginAgain()}
                {this.props.children}
                {this.props.isAuth && <NotificationPanel/>}
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