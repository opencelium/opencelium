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
import {connect} from "react-redux";

import {onEnter, setFocusById} from "@utils/app";
import {loginUser} from '@actions/auth';
import Input from "@basic_components/inputs/Input";
import styles from '@themes/default/layout/login.scss';
import menuStyles from '@themes/default/layout/menu.scss';
import {
    addFocusDocumentNavigation, addLoginKeyNavigation,
    removeFocusDocumentNavigation,
    removeLoginKeyNavigation
} from "@utils/key_navigation";
import ValidationMessage from "@change_component/ValidationMessage";
import {LoginOpenCelium} from "@components/icons/LoginIcon";
import {API_REQUEST_STATE} from "@utils/constants/app";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        isAuth: auth.get('isAuth'),
        logining: auth.get('logining'),
    };
}

/**
 * App Login Form
 */
@connect(mapStateToProps, {loginUser})
@withTranslation(['layout', 'users'])
class Login extends Component{

    constructor(props){
        super(props);
        this.state = {
            email: '',
            password: '',
            validationMessage: '',
        };
        let bodyElement = document.querySelector('body');
        if(bodyElement) bodyElement.classList.remove(menuStyles.body_pd);
    }

    componentDidMount(){
        addLoginKeyNavigation(this);
        addFocusDocumentNavigation(this);
        document.activeElement.blur();
        setFocusById('login_email');
    }

    componentWillUnmount(){
        removeLoginKeyNavigation(this);
        removeFocusDocumentNavigation(this);
    }

    /**
     * to change email
     *
     * @param value - email value
     */
    changeEmail(value){
        this.setState({
            email: value,
            validationMessage: '',
        });
    }

    /**
     * to change password
     *
     * @param value - password value
     */
    changePassword(value){
        this.setState({
            password: value,
            validationMessage: '',
        });
    }

    /**
     * to login into app
     */
    login(){
        if(this.validate()) {
            this.props.loginUser({email: this.state.email, password: this.state.password, fromLogin: true});
        }
    }

    /**
     * to validate Login component
     */
    validate(){
        if(this.validateEmail()) {
            return this.validatePassword();
        }
        return false;
    }

    /**
     * to validate email input
     */
    validateEmail(){
        const {email} = this.state;
        const {t} = this.props;
        if(email === ''){
            this.setState({validationMessage: t('users:ADD.VALIDATION_MESSAGES.EMAIL_REQUIRED')});
            setFocusById('login_email');
            return false;
        }
        let isEmailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let isEmail = isEmailRegExp.test(email);
        if(!isEmail){
            this.setState({validationMessage: t('users:ADD.VALIDATION_MESSAGES.WRONG_EMAIL')});
            setFocusById('login_email');
            return false;
        }
        return true;
    }

    /**
     * to press Enter key in email input
     */
    pressEnterEmail(){
        if(this.validate()) {
            this.login();
        }
    }

    /**
     * to validate password input
     */
    validatePassword(){
        const {password} = this.state;
        const {t} = this.props;
        if(password === ''){
            this.setState({validationMessage: t('users:ADD.VALIDATION_MESSAGES.PASSWORD_REQUIRED')});
            setFocusById('login_password');
            return false;
        }
        if(password.length < 3){
            this.setState({validationMessage: t('users:ADD.VALIDATION_MESSAGES.WRONG_LENGTH_PASSWORD_SHORT')});
            setFocusById('login_password');
            return false;
        }
        return true;
    }

    renderValidation(){
        const {validationMessage} = this.state;
        if(validationMessage !== '') {
            return (
                <ValidationMessage
                    message={validationMessage}
                    classNames={{validationMessage: styles.validation_message, message: styles.message}}
                />
            );
        }
        return null;
    }

    render(){
        const {t, isAuth, logining} = this.props;
        let inputStyle = styles.input;
        let captionStyle = styles.caption;
        if(isAuth){
            inputStyle += ` ${styles.hide}`;
            captionStyle += ` ${styles.hide}`;
        }
        return (
            <div className={styles.login}>
                <div className={captionStyle}>{t("LOGIN.HEADER")}</div>
                <Input
                    type={'email'}
                    placeholder={t('LOGIN.EMAIL_PLACEHOLDER')}
                    value={this.state.email}
                    theme={{...styles, input: inputStyle}}
                    onChange={::this.changeEmail}
                    onKeyPress={(e) => onEnter(e, ::this.pressEnterEmail)}
                    id={'login_email'}
                />
                <Input
                    type={'password'}
                    placeholder={t('LOGIN.PASSWORD_PLACEHOLDER')}
                    value={this.state.password}
                    theme={{...styles, input: inputStyle}}
                    onChange={::this.changePassword}
                    onKeyPress={(e) => onEnter(e, () => {::this.login(); setFocusById('login_button');})}
                    id={'login_password'}
                />
                {this.renderValidation()}
                <LoginOpenCelium
                    isAuth={isAuth}
                    isLoading={logining === API_REQUEST_STATE.START}
                    onClick={::this.login}
                    id={'login_button'}
                />
            </div>
        );
    }
}

export default Login;