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
    url: string = '';

    @App.inputType
    baseDN: string = '';

    @App.inputType
    userDN: string = '';

    @App.inputType
    groupDN: string = '';

    @App.inputType
    readAccountDN: string = '';

    @App.inputType
    readAccountPassword: string = '';

    @App.inputType
    userSearchFilter: string = '';

    @App.inputType
    groupSearchFilter: string = '';

    constructor(formData?: Partial<LdapConfigModel> | null) {
        // @ts-ignore
        super(formData?.validations || {}, formData?._readOnly, formData?.wholeInstance);
        this.url = formData?.url || '';
        this.baseDN = formData?.baseDN || '';
        this.userDN = formData?.userDN || '';
        this.groupDN = formData?.groupDN || '';
        this.readAccountDN = formData?.readAccountDN || '';
        this.readAccountPassword = formData?.readAccountPassword || '';
        this.userSearchFilter = formData?.userSearchFilter || '';
        this.groupSearchFilter = formData?.groupSearchFilter || '';
        // @ts-ignore
        this.dispatch = formData.dispatch ? formData.dispatch : useAppDispatch();
    }
    static createState<T>(args?: Partial<LdapConfigModel>, observation?: any):T{
        return super.createState<LdapConfigModel>(
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
        if(this.url === ''){
            isNotValid = true;
            this.validations['url'] = 'The url is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateUrl(this, this.url);
            if(!this.isFocused){
                document.getElementById('input_url').focus();
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
        mapping: (ldapCheckForm: ILdapCheckForm): LdapConfigModel => {
            return {
                url: ldapCheckForm.url,
                baseDN: ldapCheckForm.baseDN,
                userDN: ldapCheckForm.userDN,
                groupDN: ldapCheckForm.groupDN,
                readAccountDN: ldapCheckForm.readAccountDN,
                readAccountPassword: ldapCheckForm.readAccountPassword,
                userSearchFilter: ldapCheckForm.userSearchFilter,
                groupSearchFilter: ldapCheckForm.groupSearchFilter,
            };
        }})
    test(): boolean{
        this.isFocused = false;
        return this.validateUrl() && this.validateBaseDN() && this.validateUserDN();
    }
}
