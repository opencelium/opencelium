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
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {IUser, IUserFile, IUserRadios, IUserSelect, IUserSwitch, IUserText, IUserTextarea} from "@interface/user/IUser";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@atom/input/select/interfaces";
import {InputRadiosProps} from "@atom/input/radio/interfaces";
import {InputFileProps} from "@atom/input/file/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {UserState} from "@slice/UserSlice";
import {RootState} from "@store/store";
import {InputSwitchProps} from "@atom/input/switch/interfaces";
import {UserDetail} from "./UserDetail";
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import {
    addUser, checkUserEmail, deleteUserById,
    deleteUserImage, getUserById, updateUser,
    uploadUserImage,
} from "@action/UserCreators";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";


export class User extends HookStateClass implements IUser{
    id: number;

    static reduxState?: UserState;

    @App.inputType
    email: string = '';

    @App.inputType
    password: string = '';

    @App.inputType
    repeatPassword: string = '';

    @App.inputType
    userGroupSelect: OptionProps;

    @App.inputType
    userDetail: Partial<UserDetail> = null;

    userGroup: IUserGroup = null;

    constructor(user?: Partial<IUser> | null) {
        // @ts-ignore
        super(user?.validations || {}, user?._readOnly, user?.wholeInstance);
        this.id = user?.id || user?.userId || 0;
        if(user?.userDetail){
            let userDetail = user.userDetail;
            if(!(userDetail instanceof UserDetail)){
                userDetail = new UserDetail(userDetail)
            }
            this.userDetail = userDetail;
        }
        this.email = user?.email || '';
        this.password = user?.password || '';
        this.repeatPassword = user?.repeatPassword || '';
        this.userGroupSelect = user?.userGroupSelect || null;
        this.userGroup = user?.userGroup || null;
        if(!this.userGroupSelect && this.userGroup?.groupId){
            this.userGroupSelect = {label: this.userGroup.name, value: this.userGroup.groupId.toString()};
        }
        // @ts-ignore
        this.dispatch = user.dispatch ? user.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<IUser>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}, {functionName: 'userDetail', value: args.userDetail}];
        return super.createState<IUser>(
            User,
            (state: RootState) => state.userReducer,
            args,
            observations);
    }

    static getReduxState(){
       return useAppSelector((state: RootState) => state.userReducer);
    }

    getFullName(): string{
        return `${this.userDetail.name} ${this.userDetail.surname}`;
    }

    getText(data: IInput<IUserText, InputTextProps>):ReactElement{
        return super.getInputText<IUserText, InputTextProps>(data);
    }

    getTexts(data: IInput<IUserText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<IUserText, InputTextProps>(data);
    }

    getSelect(data: IInput<IUserSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<IUserSelect, InputSelectProps>(data);
    }

    getRadios(data: IInput<IUserRadios, InputRadiosProps>): ReactElement {
        return super.getInputRadios<IUserRadios, InputRadiosProps>(data);
    }

    getFile(data: IInput<IUserFile, InputFileProps>): ReactElement {
        return super.getInputFile<IUserFile, InputFileProps>(data);
    }

    getTextarea(data: IInput<IUserTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IUserTextarea, InputTextareaProps>(data);
    }

    getSwitch(data: IInput<IUserSwitch, InputSwitchProps>): ReactElement {
        return super.getInputSwitch<IUserSwitch, InputSwitchProps>(data);
    }

    validateName(): boolean{
        let isNotValid = false;
        if(this.userDetail.name === ''){
            isNotValid = true;
            this.userDetail.validations['name'] = 'The name is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.userDetail.updateName(this, this.userDetail.name);
            if(!this.isFocused){
                document.getElementById('input_name').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateSurname(): boolean{
        let isNotValid = false;
        if(this.userDetail.surname === ''){
            isNotValid = true;
            this.userDetail.validations['surname'] = 'The surname is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.userDetail.updateSurname(this, this.userDetail.surname);
            if(!this.isFocused){
                document.getElementById('input_surname').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateEmail(){
        let isNotValid = false;
        let isEmailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!isEmailRegExp.test(this.email)){
            this.validations['email'] = 'The invalid email';
            isNotValid = true;
        }
        if(this.email === ''){
            isNotValid = true;
            this.validations['email'] = 'The email is a required field';
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
        }
        if(this.password.length < 8){
            isNotValid = true;
            this.validations['password'] = 'The password should have at least 8 symbols';
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

    validateRepeatPassword(): boolean{
        let isNotValid = false;
        if(this.password !== this.repeatPassword){
            isNotValid = true;
            this.validations['repeatPassword'] = 'Should be equal to password';
        }
        if(this.repeatPassword === ''){
            isNotValid = true;
            this.validations['repeatPassword'] = 'The repeat password is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateRepeatPassword(this, this.repeatPassword);
            if(!this.isFocused){
                document.getElementById('input_repeatPassword').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateProfilePicture(): boolean{
        const isProfilePictureValid = this.userDetail.profilePictureFile !== null;
        if(!isProfilePictureValid){
            alert(`Profile picture of user with id ${this.id} is not valid`);
        }
        return isProfilePictureValid;
    }

    validateUserGroup(): boolean{
        let isNotValid = false;
        if(this.userGroupSelect === null){
            isNotValid = true;
            this.validations['userGroupSelect'] = 'The user group is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateUserGroupSelect(this, this.userGroupSelect);
            if(!this.isFocused){
                document.getElementById('input_userGroupSelect').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateAdd(): boolean{
        this.isFocused = false;
        const isValidName = this.validateName();
        const isValidSurname = this.validateSurname();
        const isValidEmail = this.validateEmail();
        const isValidPassword = this.validatePassword();
        const isValidRepeatPassword = this.validateRepeatPassword();
        const isValidUserGroup = this.validateUserGroup();
        return isValidName && isValidSurname && isValidEmail && isValidPassword && isValidRepeatPassword && isValidUserGroup;
    }

    @App.dispatch<IUser>(getUserById, {mapping: (user: IUser) => {return user.id;}, hasNoValidation: true})
    getById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(addUser)
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateUser)
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<IUser>(deleteUserById, {mapping: (user: IUser) => {return user.id;}, hasNoValidation: true})
    deleteById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(uploadUserImage, {hasNoValidation: true})
    uploadImage(): boolean{
        return this.validateId(this.id) && this.validateProfilePicture();
    }

    @App.dispatch(deleteUserImage, {hasNoValidation: true})
    deleteImage(): boolean{
        return this.validateId(this.id) && this.validateProfilePicture();
    }

    @App.dispatch(checkUserEmail, {hasNoValidation: true})
    checkEmail(): boolean{
        return this.validateEmail();
    }
}