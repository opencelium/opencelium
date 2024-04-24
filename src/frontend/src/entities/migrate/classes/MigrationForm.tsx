import {HookStateClass} from "@application/classes/HookStateClass";
import {Application as App} from "@application/classes/Application";
import IMigrationForm, {IMigrationText} from "@entity/migrate/interfaces/IMigrationForm";
import {IInput} from "@application/interfaces/core";
import {InputTextProps} from "@app_component/base/input/text/interfaces";
import {ReactElement, ReactNode} from "react";
import {migrate} from "@entity/migrate/redux_toolkit/action_creators/MigrationCreators";
import {MigrateRequestProps} from "@entity/migrate/requests/interfaces/IMigrate";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";

export default class MigrationForm extends HookStateClass implements IMigrationForm{

    @App.inputType
    url: string = '';

    @App.inputType
    username: string = '';

    @App.inputType
    password: string = '';

    constructor(formData?: Partial<IMigrationForm> | null) {
        // @ts-ignore
        super(formData?.validations || {}, formData?._readOnly, formData?.wholeInstance);
        this.url = formData?.url || '';
        this.username = formData?.username || '';
        this.password = formData?.password || '';
        // @ts-ignore
        this.dispatch = formData.dispatch ? formData.dispatch : useAppDispatch();
    }
    static createState<T>(args?: Partial<IMigrationForm>, observation?: any):T{
        return super.createState<IMigrationForm>(
            MigrationForm,
            (state: RootState) => state.migrationReducer,
            args,
            [{functionName: 'updateState', value: observation}]
        );
    }
    static getReduxState(){
        return useAppSelector((state: RootState) => state.migrationReducer);
    }
    getText(data: IInput<IMigrationText, InputTextProps>):ReactElement{
        return super.getInputText<IMigrationText, InputTextProps>(data);
    }
    getTexts(data: IInput<IMigrationText, InputTextProps>[]):ReactNode[]{
        return super.getInputTexts<IMigrationText, InputTextProps>(data);
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
    validateUsername(): boolean {
        let isNotValid = false;
        if(this.username === ''){
            isNotValid = true;
            this.validations['username'] = 'The username is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateUrl(this, this.username);
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
        }
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


    @App.dispatch(migrate, {
        hasNoValidation: false,
        mapping: (migrationForm: IMigrationForm):MigrateRequestProps => {
            return {
                url: migrationForm.url,
                username: migrationForm.username,
                password: migrationForm.password
            };
        }})
    migrate(): boolean{
        this.isFocused = false;
        return this.validateUrl() && this.validateUsername() && this.validatePassword();
    }
}
