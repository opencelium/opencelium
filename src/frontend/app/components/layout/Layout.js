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
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import {changeLanguage} from "../../actions/app";
import {defaultLanguage} from "../../utils/constants/languages";
import store from '../../utils/store';
import {addUserInStore} from '../../actions/users/add';

import { addUserListener,
} from '../../utils/socket/users';
import LayoutError from "./LayoutError";
import styles from '../../themes/default/layout/layout.scss';
import Notification from "../general/app/Notification";
import {NotificationType} from "../../utils/constants/notifications/notifications";
import {checkOCConnection} from "../../actions/auth";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        isAuth: auth.get('isAuth'),
        currentLanguage: auth.get('authUser') ? auth.get('authUser').current_language : defaultLanguage.code,
        checkOCConnectionResult: auth.get('checkOCConnectionResult'),
    };
}

/**
 * Layout of the app(OC)
 */
@withTranslation('notifications')
@connect(mapStateToProps, {changeLanguage, addUserInStore, checkOCConnection})
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
        const {addUserInStore} = this.props;
        addUserListener(addUserInStore);
        setInterval(::this.checkOCConnection, 10000);
    }

    checkOCConnection(){
        const {showLoginAgain} = this.state;
        const {isAuth, checkOCConnection} = this.props;
        if(isAuth && !showLoginAgain) {
            checkOCConnection({background: true});
        }
    }

    componentDidUpdate(){
        const {showLoginAgain} = this.state;
        const {checkOCConnectionResult, isAuth} = this.props;
        if(checkOCConnectionResult !== null && !showLoginAgain && isAuth){
            this.setState({
                showLoginAgain: true,
            });
        }
        if(checkOCConnectionResult === null && showLoginAgain && isAuth){
            this.setState({
                showLoginAgain: false,
            });
        }
    }

    toggleMenu(){
        this.setState({isMenuVisible: !this.state.isMenuVisible});
    }

    hideMenu(){
        this.setState({isMenuVisible: false});
    }

    renderLoginAgain(){
        const {showLoginAgain} = this.state;
        const {location} = this.props;
        if(showLoginAgain && location.pathname !== '/login') {
            const {t} = this.props;
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
        return null;
    }

    renderHeader(){
        if(this.props.isAuth){
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
export default Layout;