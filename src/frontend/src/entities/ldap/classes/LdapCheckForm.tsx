import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import ILdapCheckForm, {ILdapText} from "@entity/ldap/interfaces/ILdapCheckForm";
import {IInput} from "@application/interfaces/core";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {ReactElement, ReactNode} from "react";
import {testConfig} from "@entity/ldap/redux_toolkit/action_creators/LdapCreators";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import LdapConfigModel from "@entity/ldap/requests/models/LdapConfigModel";

export default class LdapCheckForm extends HookStateClass implements ILdapCheckForm{

    @App.inputType
    urls: string = '';

    @App.inputType
    baseDN: string = '';

    @App.inputType
    userDN: string = '';

    @App.inputType
    groupDN: string = '';

    @App.inputType
    username: string = '';

    @App.inputType
    password: string = '';

    @App.inputType
    userSearchFilter: string = '';

    @App.inputType
    groupSearchFilter: string = '';

    constructor(formData?: Partial<LdapConfigModel> | null) {
        // @ts-ignore
        super(formData?.validations || {}, formData?._readOnly, formData?.wholeInstance);
        this.urls = formData?.urls || '';
        this.baseDN = formData?.baseDN || '';
        this.userDN = formData?.userDN || '';
        this.groupDN = formData?.groupDN || '';
        this.username = formData?.username || '';
        this.password = formData?.password || '';
        this.userSearchFilter = formData?.userSearchFilter || '';
        this.groupSearchFilter = formData?.groupSearchFilter || '';
        // @ts-ignore
        this.dispatch = formData.dispatch ? formData.dispatch : useAppDispatch();
    }
    static createState<T>(args?: Partial<ILdapCheckForm>, observation?: any):T{
        return super.createState<ILdapCheckForm>(
            LdapCheckForm,
            (state: RootState) => state.ldapReducer,
            args,
            [{functionName: 'updateState', value: observation}]
        );
    }
    static getReduxState(){
        return useAppSelector((state: RootState) => state.ldapReducer);
    }
    getText(data: IInput<ILdapText, InputTextProps>):ReactElement{
        return super.getInputText<ILdapText, InputTextProps>(data);
    }
    getTexts(data: IInput<ILdapText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<ILdapText, InputTextProps>(data);
    }
    validateUrl(): boolean{
        let isNotValid = false;
        if(this.urls === ''){
            isNotValid = true;
            this.validations['urls'] = 'The url is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateUrls(this, this.urls);
            if(!this.isFocused){
                document.getElementById('input_urls').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }
    validateBaseDN(): boolean{
        let isNotValid = false;
        if(this.baseDN === ''){
            isNotValid = true;
            this.validations['baseDN'] = 'The baseDN is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateBaseDN(this, this.baseDN);
            if(!this.isFocused){
                document.getElementById('input_baseDN').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }
    validateUserDN(): boolean{
        let isNotValid = false;
        if(this.userDN === ''){
            isNotValid = true;
            this.validations['userDN'] = 'The userDN is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateUserDN(this, this.userDN);
            if(!this.isFocused){
                document.getElementById('input_userDN').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }


    @App.dispatch(testConfig, {
        hasNoValidation: false,
        mapping: (): void => {}})
    test(): boolean{
        this.isFocused = false;
        return this.validateUrl() && this.validateBaseDN() && this.validateUserDN();
    }
}
