import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "./HookStateClass";
import {Application as App} from "./Application";
import {
    IAuth,
    IAuthText,
} from "@interface/application/IAuth";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {RootState} from "@store/store";
import {AuthState} from "@slice/application/AuthSlice";
import {login} from "@action/application/AuthCreators";
import {useAppSelector} from "../../hooks/redux";


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
        let isEmailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!isEmailRegExp.test(this.email)){
            this.validations['email'] = 'The invalid email';
            // @ts-ignore
            this.updateEmail(this, this.email);
            return false;
        }
        return true;
    }

    @App.dispatch(login, {mapping: (authData: IAuth) => {return {email: authData.email, password: authData.password};}})
    login(): boolean{
        return this.validateEmail();
    }
}