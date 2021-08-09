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

import React, { Component } from 'react';
import {setFocusById} from "@utils/app";
import {INPUTS} from "@utils/constants/inputs";
import {USER_TOURS} from "@utils/constants/tours";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Form from "@change_component/Form";
import {UserPermissions} from "@utils/constants/permissions";
import OCTour from "@basic_components/OCTour";


/**
 * common component to add and update User
 */
export function UserChange(type){
    return function (Component) {
        return class extends Component{
            constructor(props){
                super(props);

                this.userPrefixUrl = '/users';
                this.translationKey = type.toUpperCase();
                this.isUpdate = type === 'update';
                this.actionName = this.isUpdate ? `updatingUser` : `addingUser`
                this.state = {
                    validationMessages: {
                        name: '',
                        surname: '',
                        email: '',
                        password: '',
                        repeatPassword: '',
                        userGroup: '',
                    },
                    entity: null,
                };
            }

            componentDidMount(){
                setFocusById('input_mr');
            }

            componentDidUpdate(prevProps, prevState, snapshot) {
                const {checkingUserEmail, checkEmailResult, t, checkValidationRequest} = this.props;
                checkValidationRequest(this, 'email', checkingUserEmail === API_REQUEST_STATE.FINISH && prevProps.checkingUserEmail === API_REQUEST_STATE.START, checkEmailResult, t(`${this.translationKey}.VALIDATION_MESSAGES.EMAIL_EXIST`));
            }

            /**
             * to clear validation message by name
             */
            clearValidationMessage(name){
                const {setValidationMessage} = this.props;
                setValidationMessage(this, name, '');
            }

            /**
             * to redirect app after action
             */
            redirect(){
                const {router, params, authUser} = this.props;
                if(params && params.id) {
                    if (authUser.userId === parseInt(params.id)) {
                        router.push('/myprofile');
                    } else {
                        router.push(`${this.userPrefixUrl}/${params.id}/view`);
                    }
                } else{
                    router.push(this.userPrefixUrl);
                }
            }

            /**
             * to map userGroups for select
             */
            mapUserGroups(){
                const {userGroups, t} = this.props;
                let result = {userGroups: [], descriptions: []};
                if(userGroups.length > 0) {
                    result.userGroups.push({label: t(`${this.translationKey}.FORM.USER_GROUP_PLACEHOLDER`), value: 0});
                    result.descriptions.push(t(`${this.translationKey}.FORM.DESCRIPTION_DEFAULT`));
                    userGroups.map(userGroup => {
                        result.userGroups.push({label: userGroup.role, value: userGroup.id});
                        result.descriptions[userGroup.id] = userGroup.description;
                    });
                }
                return result;
            }

            /**
             * to validate name if empty
             */
            validateName(entity){
                const {t} = this.props;
                if(entity.name.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.NAME_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate surname if empty
             */
            validateSurname(entity){
                const {t} = this.props;
                if(entity.surname.trim() === ''){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.SURNAME_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to validate email format, on empty, on exist
             */
            validateEmail(entity){
                const {t, checkUserEmail, checkEmailResult, user} = this.props;
                let message = '';
                let isEmail;
                if(entity.email.trim() === ''){
                    message = t(`${this.translationKey}.VALIDATION_MESSAGES.EMAIL_REQUIRED`);
                    isEmail = false;
                } else {
                    let isEmailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    isEmail = isEmailRegExp.test(entity.email);
                    if (!isEmail) {
                        message = t(`${this.translationKey}.VALIDATION_MESSAGES.WRONG_EMAIL`);
                    } else {
                        if(!this.isUpdate || (this.isUpdate && user.email !== entity.email)) {
                            if (!(this.state.entity && entity.email === this.state.entity.email && checkEmailResult && checkEmailResult.message === 'NOT_EXISTS')) {
                                checkUserEmail(entity);
                                return {value: false, message: ''};
                            }
                        }
                    }
                }
                return {value: isEmail, message};
            }

            /**
             * to validate password on length
             */
            validatePassword(entity){
                const {t} = this.props;
                let hasCorrectLength = true;
                let message = '';
                if(entity.password.trim() === '') {
                    hasCorrectLength = false;
                    message = t(`${this.translationKey}.VALIDATION_MESSAGES.PASSWORD_REQUIRED`);
                } else {
                    if (entity.password.length < 8 || entity.password.length > 16) {
                        hasCorrectLength = false;
                        message = t(`${this.translationKey}.VALIDATION_MESSAGES.WRONG_LENGTH_PASSWORD`);
                    }
                }
                return {value: hasCorrectLength, message};
            }

            /**
             * to validate repeat password on equality to password
             */
            validateRepeatPassword(entity){
                const {t} = this.props;
                let isEqual = entity.password === entity.repeatPassword;
                let message = '';
                if(entity.repeatPassword.trim() === '') {
                    isEqual = false;
                    message = t(`${this.translationKey}.VALIDATION_MESSAGES.REPEAT_PASSWORD_REQUIRED`);
                } else {
                    if (!isEqual) {
                        message = t(`${this.translationKey}.VALIDATION_MESSAGES.WRONG_REPEAT_PASSWORD`);
                    }
                }
                return {value: isEqual, message};
            }

            /**
             * to validate UserGroup if was selected
             */
            validateUserGroup(entity){
                const {t} = this.props;
                if(entity.userGroup === 0){
                    return {value: false, message: t(`${this.translationKey}.VALIDATION_MESSAGES.USERGROUP_REQUIRED`)};
                }
                return {value: true, message: ''};
            }

            /**
             * to parse user after fetch
             */
            parseEntity(){
                if(this.isUpdate) {
                    const {user, params} = this.props;
                    let result = {};
                    result.id = params.id;
                    result.email = user.email;
                    result.password = '';
                    result.repeatPassword = '';
                    result.name = user.userDetail.name;
                    result.surname = user.userDetail.surname;
                    result.phoneNumber = user.userDetail.phoneNumber;
                    result.organisation = user.userDetail.organisation;
                    result.department = user.userDetail.department;
                    result.userTitle = user.userDetail.userTitle;
                    result.profilePicture = user.userDetail.profilePicture;
                    result.userGroup = user.userGroups.groupId;
                    result.description = user.userGroups.description;
                    return result;
                }
                return null;
            }

            /**
             * to add/update User
             */
            doAction(entity){
                const {doAction} = this.props;
                doAction(entity, this);
            }

            render(){
                const {validationMessages} = this.state;
                const {t, checkingUserEmail, openTour, closeTour, isTourOpen} = this.props;
                let {userGroups, descriptions} = this.mapUserGroups();
                let contentTranslations = {};
                contentTranslations.header = {title: t(`${this.translationKey}.HEADER`), onHelpClick: openTour};
                contentTranslations.list_button = {title: t(`${this.translationKey}.LIST_BUTTON`), link: this.userPrefixUrl};
                contentTranslations.action_button = {title: t(`${this.translationKey}.${this.translationKey}_BUTTON`), link: this.userPrefixUrl};
                const parsedEntity = this.parseEntity();
                const contents = [
                    {
                        inputs:[
                            {...INPUTS.USER_TITLE,
                                label: t(`${this.translationKey}.FORM.USER_TITLE`),
                                defaultValue: ''
                            },
                            {...INPUTS.NAME,
                                error: validationMessages.name,
                                label: t(`${this.translationKey}.FORM.NAME`),
                                tourStep: USER_TOURS.page_1[0].selector,
                                maxLength: 128,
                                required: true,
                                defaultValue: '',
                            },
                            {...INPUTS.SURNAME,
                                error: validationMessages.surname,
                                label: t(`${this.translationKey}.FORM.SURNAME`),
                                tourStep: USER_TOURS.page_1[1].selector,
                                maxLength: 128,
                                required: true,
                                defaultValue: '',
                            },
                            {...INPUTS.PHONE_NUMBER, label: t(`${this.translationKey}.FORM.PHONE_NUMBER`), defaultValue: ''},
                            {...INPUTS.DEPARTMENT, label: t(`${this.translationKey}.FORM.DEPARTMENT`), defaultValue: ''},
                            {...INPUTS.ORGANIZATION, label: t(`${this.translationKey}.FORM.ORGANISATION`), defaultValue: ''},
                            {...INPUTS.PROFILE_PICTURE, label: t(`${this.translationKey}.FORM.PROFILE_PICTURE`), browseTitle: t(`${this.translationKey}.FORM.PROFILE_PICTURE_PLACEHOLDER`)},
                        ],
                        hint: {text: t(`${this.translationKey}.FORM.HINT_2`), openTour},
                        header: t(`${this.translationKey}.FORM.PAGE_2`),
                    },[
                        {
                            inputs: [
                                {...INPUTS.EMAIL,
                                    error: validationMessages.email,
                                    label: t(`${this.translationKey}.FORM.EMAIL`),
                                    tourStep: USER_TOURS.page_1[2].selector,
                                    maxLength: 255,
                                    required: true,
                                    defaultValue: '',
                                    isLoading: checkingUserEmail === API_REQUEST_STATE.START,
                                },
                                {...INPUTS.PASSWORD,
                                    error: validationMessages.password,
                                    label: t(`${this.translationKey}.FORM.PASSWORD`),
                                    tourStep: USER_TOURS.page_1[3].selector,
                                    maxLength: 16,
                                    required: true,
                                    defaultValue: '',
                                },
                                {...INPUTS.REPEAT_PASSWORD,
                                    error: validationMessages.repeatPassword,
                                    label: t(`${this.translationKey}.FORM.REPEAT_PASSWORD`),
                                    tourStep: USER_TOURS.page_1[4].selector,
                                    maxLength: 16,
                                    required: true,
                                    defaultValue: '',
                                },
                            ],
                            hint: {text: t(`${this.translationKey}.FORM.HINT_1`), openTour},
                            header: t(`${this.translationKey}.FORM.PAGE_1`),
                        },{
                            inputs:[
                                {...INPUTS.USER_GROUP,
                                    error: validationMessages.userGroup,
                                    label: t(`${this.translationKey}.FORM.USER_GROUP`),
                                    tourStep: USER_TOURS.page_1[5].selector,
                                    source: userGroups,
                                    required: true,
                                    defaultValue: 0,
                                    description: {name: 'description', label: t(`${this.translationKey}.FORM.DESCRIPTION`), values: descriptions},
                                }
                            ],
                            hint: {text: t(`${this.translationKey}.FORM.HINT_3`), openTour},
                            header: t(`${this.translationKey}.FORM.PAGE_3`),
                        }
                    ],
                ];
                return (
                    <React.Fragment>
                        <Form
                            contents={contents}
                            translations={contentTranslations}
                            isActionInProcess={this.props[this.actionName] === API_REQUEST_STATE.START || checkingUserEmail === API_REQUEST_STATE.START}
                            permissions={UserPermissions}
                            clearValidationMessage={::this.clearValidationMessage}
                            action={::this.doAction}
                            entity={parsedEntity}
                            type={type}
                        />
                        <OCTour
                            steps={USER_TOURS.page_1}
                            isOpen={isTourOpen}
                            onRequestClose={closeTour}
                        />
                    </React.Fragment>
                );
            }
        };
    };
}
