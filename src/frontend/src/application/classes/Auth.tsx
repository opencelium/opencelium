/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../classes/HookStateClass";
import {Application as App} from "./Application";
import {
    IAuth,
    IAuthText,
} from "../interfaces/IAuth";
import {IInput} from "../interfaces/core";
import {RootState, useAppSelector} from "../utils/store";
import {AuthState} from "../redux_toolkit/slices/AuthSlice";
import {login} from "../redux_toolkit/action_creators/AuthCreators";
import {InputTextProps} from "@app_component/base/input/text/interfaces";

// class to login into the application
export class Auth extends HookStateClass implements IAuth{
    id: number;

    @App.inputType
    email: string = '';

    @App.inputType
    password: string = '';

    static reduxState?: AuthState;

    constructor(authData?: Partial<IAuth> | null) {
        // @ts-ignore
        super(authData?.validations || {});
        this.email = authData?.email || '';
        this.password = authData?.password || '';
    }

    static createState<T>(args?: Partial<IAuth>):T{
        return super.createState<IAuth>(Auth, (state: RootState) => state.authReducer, args);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.authReducer);
    }

    getText(data: IInput<IAuthText, InputTextProps>):ReactElement{
        return super.getInputText<IAuthText, InputTextProps>(data);
    }

    getTexts(data: IInput<IAuthText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<IAuthText, InputTextProps>(data);
    }

    validateEmail(){
        let isNotValid = false;
        let isEmailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if(this.email === ''){
            isNotValid = true;
            this.validations['email'] = 'The email is a required field';
        }
        if(!isEmailRegExp.test(this.email) && !isNotValid){
            this.validations['email'] = 'The invalid email';
            isNotValid = true;
        }
        if(isNotValid){
            // @ts-ignore
            this.updateEmail(this, this.email);
            if(!this.isFocused){
                document.getElementById('input_email').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validatePassword(): boolean{
        let isNotValid = false;
        if(this.password === ''){
            isNotValid = true;
            this.validations['password'] = 'The password is a required field';
        }/*
        if(this.password.length < 8 && !isNotValid){
            isNotValid = true;
            this.validations['password'] = 'The password should have at least 8 symbols';
        }*/
        if(isNotValid){
            // @ts-ignore
            this.updatePassword(this, this.password);
            if(!this.isFocused){
                document.getElementById('input_password').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateLogin(): boolean {
        this.isFocused = false;
        const isValidEmail = this.validateEmail();
        const isValidPassword = this.validatePassword();
        return isValidEmail && isValidPassword;
    }

    @App.dispatch(login, {mapping: (authData: IAuth) => {return {email: authData.email, password: authData.password};}})
    login(): boolean{
        return this.validateLogin();
    }
}