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
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import Content from "../../../general/content/Content";
import ChangeContent from "@change_component/ChangeContent";

import {checkUserEmail} from '@actions/users/fetch';
import {addUser} from '@actions/users/add';
import {fetchUserGroups} from '@actions/usergroups/fetch';
import {permission} from "@decorators/permission";
import {UserPermissions} from "@utils/constants/permissions";
import {INPUTS} from "@utils/constants/inputs";
import {automaticallyShowTour, USER_TOURS} from "@utils/constants/tours";
import OCTour from "@basic_components/OCTour";
import {SingleComponent} from "@decorators/SingleComponent";
import {setFocusById} from "@utils/app";

const userPrefixURL = '/users';

function mapStateToProps(state){
    const auth = state.get('auth');
    const users = state.get('users');
    const userGroups = state.get('userGroups');
    return{
        authUser: auth.get('authUser'),
        addingUser: users.get('addingUser'),
        error: users.get('error'),
        userGroups: userGroups.get('userGroups').toJS(),
        fetchingUserGroups: userGroups.get('fetchingUserGroups'),
        checkingUserEmail: users.get('checkingUserEmail'),
        checkEmailResult: users.get('checkEmailResult'),
    };
}

function mapUser(user){
    let updatedUser = {};
    updatedUser.email = user.email;
    updatedUser.password = user.password;
    updatedUser.repeatPassword = user.repeatPassword;
    updatedUser.userGroup = user.userGroup;
    updatedUser.userDetail = {};
    updatedUser.userDetail.name = user.name;
    updatedUser.userDetail.surname = user.surname;
    updatedUser.userDetail.phoneNumber = user.phoneNumber;
    updatedUser.userDetail.organisation = user.organisation;
    updatedUser.userDetail.department = user.department;
    updatedUser.userDetail.userTitle = user.userTitle;
    updatedUser.userDetail.profilePicture = user.profilePicture;

    return updatedUser;
}

/**
 * Component to Add User
 */
@connect(mapStateToProps, {addUser, fetchUserGroups, checkUserEmail})
@permission(UserPermissions.CREATE, true)
@withTranslation(['users', 'app'])
@SingleComponent('user', 'adding', ['userGroups'], mapUser)
class UserAdd extends Component{

    constructor(props){
        super(props);

        const {authUser} = this.props;
        this.startCheckingEmail = false;
        this.state = {
            currentTour: 'page_1',
            isTourOpen: automaticallyShowTour(authUser),
        };
    }

    componentDidMount(){
        setFocusById('input_email');
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        const {authUser} = this.props;
        this.startCheckingEmail = false;
        this.setState({
            currentTour: `page_${pageNumber}`,
            isTourOpen: automaticallyShowTour(authUser),
        });
    }

    /**
     * to close current Tour
     */
    closeTour(){
        this.setState({
            isTourOpen: false,
        });
    }

    /**
     * to open current Tour
     */
    openTour(){
        this.setState({
            isTourOpen: true,
        });
    }

    /**
     * to redirect app after add
     */
    redirect(){
        this.props.router.push(`${userPrefixURL}`);
    }

    /**
     * to map userGroups for select
     */
    mapUserGroups(){
        const {userGroups, t} = this.props;
        let result = {userGroups: [], descriptions: []};
        if(userGroups.length > 0) {
            result.userGroups.push({label: t(`ADD.FORM.USER_GROUP_PLACEHOLDER`), value: 0});
            result.descriptions.push(t(`ADD.FORM.DESCRIPTION_DEFAULT`));
            userGroups.map(userGroup => {
                result.userGroups.push({label: userGroup.role, value: userGroup.id});
                result.descriptions[userGroup.id] = userGroup.description;
            });
        }
        return result;
    }

    checkUserEmail(entity){
        this.props.checkUserEmail(entity);
    }

    /**
     * to validate email on format
     */
    validateEmail(entity){
        const {t} = this.props;
        let message = '';
        let isEmail = true;
        if(entity.email === ''){
            message = t('ADD.VALIDATION_MESSAGES.EMAIL_REQUIRED');
            isEmail = false;
        } else {
            let isEmailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            isEmail = isEmailRegExp.test(entity.email);
            if (!isEmail) {
                message = t('ADD.VALIDATION_MESSAGES.WRONG_EMAIL');
            } else {
                this.startCheckingEmail = true;
                this.checkUserEmail(entity);
                return {value: false, message: ''};
            }
        }
        if(!isEmail){
            setFocusById('input_email');
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
        if(entity.password === '') {
            hasCorrectLength = false;
            message = t('ADD.VALIDATION_MESSAGES.PASSWORD_REQUIRED');
        } else {
            if (entity.password.length < 8 || entity.password.length > 16) {
                hasCorrectLength = false;
                message = t('ADD.VALIDATION_MESSAGES.WRONG_LENGTH_PASSWORD');
            }
        }
        if(!hasCorrectLength){
            setFocusById('input_password');
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
        if(entity.repeatPassword === '') {
            isEqual = false;
            message = t('ADD.VALIDATION_MESSAGES.REPEAT_PASSWORD_REQUIRED');
        } else {
            if (!isEqual) {
                message = t('ADD.VALIDATION_MESSAGES.WRONG_REPEAT_PASSWORD');
            }
        }
        if(!isEqual){
            setFocusById('input_repeatPassword');
        }
        return {value: isEqual, message};
    }

    /**
     * to validate name if empty
     */
    validateName(entity){
        const {t} = this.props;
        if(entity.name === ''){
            setFocusById('input_name');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.NAME_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate surname if empty
     */
    validateSurname(entity){
        const {t} = this.props;
        if(entity.surname === ''){
            setFocusById('input_surname');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.SURNAME_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    /**
     * to validate UserGroup if was selected
     */
    validateUsergroup(entity){
        const {t} = this.props;
        if(entity.userGroup === 0){
            setFocusById('input_userGroup');
            return {value: false, message: t('ADD.VALIDATION_MESSAGES.USERGROUP_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    render(){
        let {userGroups, descriptions} = this.mapUserGroups();
        const {t, authUser, checkingUserEmail, checkEmailResult, addingUser, doAction} = this.props;
        let contentTranslations = {};
        contentTranslations.header = t('ADD.HEADER');
        contentTranslations.list_button = t('ADD.LIST_BUTTON');
        let changeContentTranslations = {};
        changeContentTranslations.addButton = t('ADD.ADD_BUTTON');
        let getListLink = `${userPrefixURL}`;
        let breadcrumbsItems = [t('ADD.FORM.PAGE_1'), t('ADD.FORM.PAGE_2'), t('ADD.FORM.PAGE_3')];
        let contents = [{
                inputs: [
                    {...INPUTS.EMAIL,
                        label: t('ADD.FORM.EMAIL'),
                        tourStep: USER_TOURS.page_1[0].selector,
                        maxLength: 255,
                        required: true,
                        defaultValue: '',
                        check: (e, entity) => ::this.validateEmail(e, entity),
                        request: {
                            inProcess: checkingUserEmail,
                            status: this.startCheckingEmail && !checkingUserEmail,
                            result: checkEmailResult,
                            notSuccessMessage: t('ADD.VALIDATION_MESSAGES.EMAIL_EXIST'),
                        }},
                    {...INPUTS.PASSWORD,
                        label: t('ADD.FORM.PASSWORD'),
                        tourStep: USER_TOURS.page_1[1].selector,
                        maxLength: 16,
                        required: true,
                        defaultValue: '',
                        check: (e, entity) => ::this.validatePassword(e, entity)
                    },
                    {...INPUTS.REPEAT_PASSWORD,
                        label: t('ADD.FORM.REPEAT_PASSWORD'),
                        tourStep: USER_TOURS.page_1[2].selector,
                        maxLength: 16,
                        required: true,
                        defaultValue: '',
                        check: (e, entity) => ::this.validateRepeatPassword(e, entity)
                    },
                ],
                hint: {text: t('ADD.FORM.HINT_1'), openTour: ::this.openTour},
            },{
                inputs:[
                    {...INPUTS.NAME,
                        label: t('ADD.FORM.NAME'),
                        tourStep: USER_TOURS.page_2[0].selector,
                        maxLength: 128,
                        required: true,
                        defaultValue: '',
                        check: (e, entity) => ::this.validateName(e, entity)
                    },
                    {...INPUTS.SURNAME,
                        label: t('ADD.FORM.SURNAME'),
                        tourStep: USER_TOURS.page_2[1].selector,
                        maxLength: 128,
                        required: true,
                        defaultValue: '',
                        check: (e, entity) => ::this.validateSurname(e, entity)
                    },
                    {...INPUTS.PHONE_NUMBER, label: t('ADD.FORM.PHONE_NUMBER'), defaultValue: ''},
                    {...INPUTS.DEPARTMENT, label: t('ADD.FORM.DEPARTMENT'), defaultValue: ''},
                    {...INPUTS.ORGANIZATION, label: t('ADD.FORM.ORGANISATION'), defaultValue: ''},
                    {...INPUTS.USER_TITLE, label: t('ADD.FORM.USER_TITLE'), defaultValue: ''},
                    {...INPUTS.PROFILE_PICTURE, label: t('ADD.FORM.PROFILE_PICTURE'), browseTitle: t('ADD.FORM.PROFILE_PICTURE_PLACEHOLDER')},
                ],
                hint: {text: t('ADD.FORM.HINT_2'), openTour: ::this.openTour},
            },{
                inputs:[
                    {...INPUTS.USER_GROUP,
                        label: t('ADD.FORM.USER_GROUP'),
                        tourStep: USER_TOURS.page_3[0].selector,
                        source: userGroups,
                        required: true,
                        defaultValue: 0,
                        description: {name: 'description', label: t('ADD.FORM.DESCRIPTION'), values: descriptions},
                        check: (e, entity) => ::this.validateUsergroup(e, entity)
                    }
                ],
                hint: {text: t('ADD.FORM.HINT_3'), openTour: ::this.openTour},
            },
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={UserPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={doAction}
                    isActionInProcess={addingUser}
                    authUser={authUser}
                    onPageSwitch={::this.setCurrentTour}
                />
                <OCTour
                    steps={USER_TOURS[this.state.currentTour]}
                    isOpen={this.state.isTourOpen}
                    onRequestClose={::this.closeTour}
                />
            </Content>
        );
    }
}

export default UserAdd;