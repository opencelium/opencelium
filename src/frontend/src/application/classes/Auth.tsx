/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {ReactElement, ReactNode} from "react";
import {HookStateClass} from "../classes/HookStateClass";
import {Application as App} from "./Application";
import {
    IAuth,
    IAuthText, ICredentials,
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
    username: string = '';

    @App.inputType
    password: string = '';

    static reduxState?: AuthState;

    constructor(authData?: Partial<IAuth> | null) {
        // @ts-ignore
        super(authData?.validations || {});
        this.username = authData?.username || '';
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

    getTexts(data: IInput<IAuthText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<IAuthText, InputTextProps>(data);
    }

    validateEmail(){
        let isNotValid = false;
        if(this.username === ''){
            isNotValid = true;
            this.validations['username'] = 'The username is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateUsername(this, this.username);
            if(!this.isFocused){
                document.getElementById('input_username').focus();
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
        const isValidUsername = this.validateEmail();
        const isValidPassword = this.validatePassword();
        return isValidUsername && isValidPassword;
    }

    @App.dispatch(login, {mapping: (authData: IAuth): ICredentials => {return {email: authData.username, password: authData.password};}})
    login(): boolean{
        return this.validateLogin();
    }
}
