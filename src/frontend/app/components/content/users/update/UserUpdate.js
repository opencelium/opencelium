/*
 * Copyright (C) <2019>  <becon GmbH>
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
import ChangeContent from "../../../general/change_component/ChangeContent";

import {fetchUser, checkUserEmail} from '../../../../actions/users/fetch';
import {updateUser} from '../../../../actions/users/update';
import {fetchUserGroups} from '../../../../actions/usergroups/fetch';
import {SingleComponent} from "../../../../decorators/SingleComponent";
import {permission} from "../../../../decorators/permission";
import {UserPermissions} from "../../../../utils/constants/permissions";
import {INPUTS} from "../../../../utils/constants/inputs";
import {USER_TOURS} from "../../../../utils/constants/tours";
import OCTour from "../../../general/basic_components/OCTour";
import {setFocusById} from "../../../../utils/app";


const prefixUrl = '/users';

function mapStateToProps(state){
    const auth = state.get('auth');
    const users = state.get('users');
    const userGroups = state.get('userGroups');
    return{
        authUser: auth.get('authUser'),
        user: users.get('user'),
        error: users.get('error'),
        fetchingUser: users.get('fetchingUser'),
        updatingUser: users.get('updatingUser'),
        userGroups: userGroups.get('userGroups').toJS(),
        fetchingUserGroups: userGroups.get('fetchingUserGroups'),
        checkingUserEmail: users.get('checkingUserEmail'),
        checkEmailResult: users.get('checkEmailResult'),
    };
}

function mapUser(user){
    let updatedUser = {};
    updatedUser.id = user.id;
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
    updatedUser.userDetail.profilePicture = user.profilePicture === '' ? null : user.profilePicture;

    return updatedUser;
}


/**
 * Component to Update User
 */
@connect(mapStateToProps, {updateUser, fetchUser, fetchUserGroups, checkUserEmail})
@permission(UserPermissions.UPDATE, true)
@withTranslation(['users', 'app'])
@SingleComponent('user', 'updating', ['userGroups'], mapUser)
class UserUpdate extends Component{

    constructor(props){
        super(props);

        this.startCheckingEmail = false;
        this.state = {
            currentTour: 'page_1',
            isTourOpen: false,
        };
    }

    componentDidMount(){
        setFocusById('input_email');
    }

    /**
     * to map userGroups for select
     */
    mapUserGroups(){
        const {userGroups, t} = this.props;
        let result = {userGroups: [], descriptions: []};
        if(userGroups.length !== 0) {
            result.userGroups.push({label: t(`UPDATE.FORM.USER_GROUP_PLACEHOLDER`), value: 0});
            result.descriptions.push(t(`UPDATE.FORM.DESCRIPTION_DEFAULT`));
            userGroups.map(userGroup => {
                result.userGroups.push({label: userGroup.role, value: userGroup.id});
                result.descriptions[userGroup.id] = userGroup.description;
            });
        }
        return result;
    }

    /**
     * to set appropriate Tour
     */
    setCurrentTour(pageNumber){
        this.startCheckingEmail = false;
        this.setState({
            currentTour: `page_${pageNumber}`,
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
     * to redirect app after update
     */
    redirect(){
        const {router, params, authUser} = this.props;
        if(authUser.userId === parseInt(params.id)){
            router.push('/myprofile');
        } else {
            router.push(`${prefixUrl}/${params.id}/view`);
        }
    }

    /**
     * to parse user after fetch
     */
    parseEntity(){
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
        result.profilePicture = '';
        result.userGroup = user.userGroups.groupId;
        result.description = user.userGroups.description;
        return result;
    }

    checkUserEmail(entity){
        this.props.checkUserEmail(entity);
    }

    /**
     * to validate email on format
     */
    validateEmail(entity){
        const {t, user} = this.props;
        let message = '';
        let isEmail = true;
        if(entity.email === ''){
            message = t('UPDATE.VALIDATION_MESSAGES.EMAIL_REQUIRED');
            isEmail = false;
        } else {
            let isEmailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            isEmail = isEmailRegExp.test(entity.email);
            if (!isEmail) {
                message = t('UPDATE.VALIDATION_MESSAGES.WRONG_EMAIL');
            } else {
                if(entity.email !== user.email) {
                    this.startCheckingEmail = true;
                    this.checkUserEmail(entity);
                    return {value: false, message: ''};
                }
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
            message = t('UPDATE.VALIDATION_MESSAGES.PASSWORD_REQUIRED');
        } else {
            if (entity.password.length < 8 || entity.password.length > 16) {
                hasCorrectLength = false;
                message = t('UPDATE.VALIDATION_MESSAGES.WRONG_LENGTH_PASSWORD');
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
            message = t('UPDATE.VALIDATION_MESSAGES.REPEAT_PASSWORD_REQUIRED');
        } else {
            if (!isEqual) {
                message = t('UPDATE.VALIDATION_MESSAGES.WRONG_REPEAT_PASSWORD');
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
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.NAME_REQUIRED')};
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
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.SURNAME_REQUIRED')};
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
            return {value: false, message: t('UPDATE.VALIDATION_MESSAGES.USERGROUP_REQUIRED')};
        }
        return {value: true, message: ''};
    }

    render(){
        const {t, authUser, checkingUserEmail, checkEmailResult, updatingUser, doAction} = this.props;
        let {userGroups, descriptions} = this.mapUserGroups();
        let parsedEntity = this.parseEntity();
        let getListLink = `${prefixUrl}`;
        let breadcrumbsItems = [t('UPDATE.FORM.PAGE_1'), t('UPDATE.FORM.PAGE_2'), t('UPDATE.FORM.PAGE_3')];
        let contentTranslations = {};
        let changeContentTranslations = {};
        contentTranslations.header = t('UPDATE.HEADER');
        contentTranslations.list_button = t('UPDATE.LIST_BUTTON');
        changeContentTranslations.updateButton = t('UPDATE.UPDATE_BUTTON');
        let contents = [{
                inputs: [
                    {
                        ...INPUTS.EMAIL,
                        tourStep: USER_TOURS.page_1[0].selector,
                        label: t('UPDATE.FORM.EMAIL'),
                        maxLength: 255,
                        required: true,
                        check: (e, entity) => ::this.validateEmail(e, entity),
                        request: {
                            inProcess: checkingUserEmail,
                                status: this.startCheckingEmail && !checkingUserEmail,
                                result: checkEmailResult,
                                notSuccessMessage: t('UPDATE.FORM.EMAIL_EXIST'),
                        }},
                    {
                        ...INPUTS.PASSWORD,
                        tourStep: USER_TOURS.page_1[1].selector,
                        label: t('UPDATE.FORM.PASSWORD'),
                        maxLength: 16,
                        check: (e, entity) => ::this.validatePassword(e, entity)},
                    {
                        ...INPUTS.REPEAT_PASSWORD,
                        tourStep: USER_TOURS.page_1[2].selector,
                        label: t('UPDATE.FORM.REPEAT_PASSWORD'),
                        maxLength: 16,
                        check: (e, entity) => ::this.validateRepeatPassword(e, entity)
                    }],
                hint: {text: t('UPDATE.FORM.HINT_1'), openTour: ::this.openTour},
            },{
                inputs:[
                    {
                        ...INPUTS.NAME,
                        tourStep: USER_TOURS.page_2[0].selector,
                        label: t('UPDATE.FORM.NAME'),
                        maxLength: 128,
                        required: true,
                        check: (e, entity) => ::this.validateName(e, entity)
                    },
                    {
                        ...INPUTS.SURNAME,
                        tourStep: USER_TOURS.page_2[1].selector,
                        label: t('UPDATE.FORM.SURNAME'),
                        maxLength: 128,
                        required: true,
                        check: (e, entity) => ::this.validateSurname(e, entity)
                    },
                    {...INPUTS.PHONE_NUMBER, label: t('UPDATE.FORM.PHONE_NUMBER')},
                    {...INPUTS.ORGANIZATION, label: t('UPDATE.FORM.ORGANISATION')},
                    {...INPUTS.DEPARTMENT, label: t('UPDATE.FORM.DEPARTMENT')},
                    {...INPUTS.USER_TITLE, label: t('UPDATE.FORM.USER_TITLE')},
                    {...INPUTS.PROFILE_PICTURE, label: t('UPDATE.FORM.PROFILE_PICTURE'), browseTitle: t('UPDATE.FORM.PROFILE_PICTURE_PLACEHOLDER')},
                ],
                hint: {text: t('UPDATE.FORM.HINT_2'), openTour: ::this.openTour},
            },{
                inputs:[
                    {
                        ...INPUTS.USER_GROUP,
                        tourStep: USER_TOURS.page_3[0].selector,
                        label: t('UPDATE.FORM.USER_GROUP'),
                        source: userGroups,
                        required: true,
                        defaultValue: 0,
                        description: {name: 'description', label: t('UPDATE.FORM.DESCRIPTION'), values: descriptions},
                        check: (e, entity) => ::this.validateUsergroup(e, entity)
                    }
                ],
                hint: {text: t('UPDATE.FORM.HINT_3'), openTour: ::this.openTour},
            },
        ];
        return (
            <Content translations={contentTranslations} getListLink={getListLink} permissions={UserPermissions} authUser={authUser}>
                <ChangeContent
                    breadcrumbsItems={breadcrumbsItems}
                    contents={contents}
                    translations={changeContentTranslations}
                    action={doAction}
                    entity={parsedEntity}
                    type={'update'}
                    isActionInProcess={updatingUser}
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

export default UserUpdate;