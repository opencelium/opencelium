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
import {connect} from "react-redux";
import {Button} from "react-toolbox/lib/button";

import {generateLabel, onEnter, setFocusById} from "../../../utils/app";
import {loginUser} from '../../../actions/auth';
import Input from "../../general/basic_components/inputs/Input";
import styles from '../../../themes/default/layout/login.scss';
import {
    addFocusDocumentNavigation, addLoginKeyNavigation,
    removeFocusDocumentNavigation,
    removeLoginKeyNavigation
} from "../../../utils/key_navigation";
import ValidationMessage from "../../general/change_component/ValidationMessage";


@connect(null, {loginUser})
@withTranslation(['auth', 'users'])
class Login extends Component{

    constructor(props){
        super(props);
        this.state = {
            email: 'admin@opencelium.io',
            password: '1234',
            validationMessage: '',
        };
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
     * on change email
     */
    emailChange(value){
        this.setState({email: value, validationMessage: '',});
    }

    /**
     * on change password
     */
    passwordChange(value){
        this.setState({password: value, validationMessage: '',});
    }

    /**
     * to login into app
     */
    login(){
        if(this.validate()) {
            this.props.loginUser({email: this.state.email, password: this.state.password});
        }
    }

    validate(){
        if(this.validateEmail()) {
            return this.validatePassword();
        }
        return false;
    }

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

    pressEnterEmail(){
        if(this.validate()) {
            this.login();
        }
    }

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
        const {t} = this.props;
        return (
            <div style={{position: 'relative'}}>
                <div className={styles.caption}>{t("LOGIN.HEADER")}</div>
                <Input
                    type={'email'}
                    placeholder={t('LOGIN.EMAIL_PLACEHOLDER')}
                    value={this.state.email}
                    theme={styles}
                    onChange={::this.emailChange}
                    onKeyPress={(e) => onEnter(e, ::this.pressEnterEmail)}
                    id={'login_email'}
                />
                <Input
                    type={'password'}
                    placeholder={t('LOGIN.PASSWORD_PLACEHOLDER')}
                    value={this.state.password}
                    theme={styles}
                    onChange={::this.passwordChange}
                    onKeyPress={(e) => onEnter(e, ::this.login)}
                    id={'login_password'}
                />
                {this.renderValidation()}
                <Button className={styles.button_connect} onClick={::this.login} autoFocus>{generateLabel(t("LOGIN.BUTTON_CONNECT"), 0, {keyNavigationLetter: styles.key_navigation_letter})}</Button>
            </div>
        );
    }
}

export default Login;