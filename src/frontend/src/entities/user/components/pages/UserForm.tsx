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

import React, {FC, useEffect, useRef} from "react";
import {useNavigate, useParams} from "react-router";
import {withTheme} from "styled-components";
import {useAppDispatch} from "@application/utils/redux";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@application/interfaces/IApplication";
import {IForm} from "@application/interfaces/IForm";
import {Form} from "@application/classes/Form";
import {permission} from "@application/utils/permission";
import {InputTextType} from "@app_component/base/input/text/interfaces";
import Button from "@app_component/base/button/Button";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import {getAllUserGroups} from "@entity/user_group/redux_toolkit/action_creators/UserGroupCreators";
import {UserGroup} from "@entity/user_group/classes/UserGroup";
import User from "../../classes/User";
import IUser from "../../interfaces/IUser";
import UserDetail from "../../classes/UserDetail";
import IUserDetail from "../../interfaces/IUserDetail";
import {UserImageStyled} from "../../components/pages/UserImage";
import {UserPermissions} from "../../constants";



const UserForm: FC<IForm> = permission<IForm>(UserPermissions.CREATE)(({isAdd, isUpdate, isView}) => {
    const {
        addingUser, updatingUser, gettingUser, isCurrentUserHasUniqueEmail,
        checkingUserEmail, currentUser, error,
    } = User.getReduxState();
    const dispatch = useAppDispatch();
    const {gettingUserGroups, userGroups} = UserGroup.getReduxState();
    const userGroupOptions: OptionProps[] = userGroups.map(userGroup => {return {label: userGroup.name, value: userGroup.groupId.toString()}});
    const didMount = useRef(false);
    let navigate = useNavigate();
    let urlParams = useParams();
    const shouldFetchUser = isUpdate || isView;
    const form = new Form({isView, isAdd, isUpdate});
    const formData = form.getFormData('user');
    let userId = 0;
    if(shouldFetchUser){
        userId = parseInt(urlParams.id);
    }
    const userDetail = UserDetail.createState<IUserDetail>({_readOnly: isView}, isAdd ? null : currentUser?.userDetail);
    const user = User.createState<IUser>({id: userId, _readOnly: isView, userDetail}, isAdd ? null : currentUser);
    useEffect(() => {
        if(shouldFetchUser){
            user.getById()
        }
        dispatch(getAllUserGroups());
    },[]);
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (isAdd && addingUser === API_REQUEST_STATE.FINISH || isUpdate && updatingUser === API_REQUEST_STATE.FINISH)){
                navigate('/users', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingUser, updatingUser]);
    const Title = user.userDetail.getRadios({propertyName: "userTitle", props: {
        icon: ' ',
        label: 'Title',
        options: [{autoFocus: true, label: 'Mr', value: 'mr', checked: true, key: 'mr'}, {label: 'Mrs', value: 'mrs', checked: false, key: 'mrs'}],
    }})
    const UserDetailsInputs = user.userDetail.getTexts([
        {propertyName: "name", props: {icon: 'perm_identity', label: "Name", maxLength: 128, required: true}},
        {propertyName: "surname", props: {icon: 'perm_identity', label: "Surname", maxLength: 128, required: true}},
        {propertyName: "department", props: {icon: 'people', label: "Department"}},
        {propertyName: "organization", props: {icon: 'domain', label: "Organization"}},
        {propertyName: "phoneNumber", props: {icon: "phone", label: "Phone Number"}},
    ]);
    const Avatar = user.userDetail.getFile({propertyName: "profilePictureFile", props:{label: "Avatar",}});
    const Credentials = user.getTexts([
        {propertyName: "email", props: {error: isCurrentUserHasUniqueEmail === TRIPLET_STATE.FALSE ? 'The email is already in use' : '', icon: 'email', label: "Email", maxLength: 255, required: true, isLoading: checkingUserEmail === API_REQUEST_STATE.START}},
        {propertyName: "password", props: {isVisible: !isView, icon: 'vpn_key', label: "Password", maxLength: 64, type: InputTextType.Password, required: true}},
        {propertyName: "repeatPassword", props: {isVisible: !isView, icon: 'vpn_key', label: "Repeat Password", type: InputTextType.Password, maxLength: 64, required: true}},
    ]);
    const UserGroupComponent = user.getSelect({propertyName: 'userGroupSelect', props: {
        icon: 'supervised_user_circle',
        label: 'User Group',
        isLoading: gettingUserGroups === API_REQUEST_STATE.START,
        options: userGroupOptions,
        required: true,
    }});
    const UserGroupTextarea = user.getTextarea({propertyName: "userGroupDescription", props: {
        label: 'Description',
        readOnly: true,
        value: "Here you will see the description of the role",
    }})
    let actions = [<Button
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/users'}
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => user.add() : () => user.update();
        actions.unshift(<Button
            key={'action_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={isAdd && addingUser === API_REQUEST_STATE.START || isUpdate && updatingUser === API_REQUEST_STATE.START}
        />);
    }

    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: formData.formTitle}],
        actions,
        formSections: [
            <FormSection label={{value: 'user details'}}>
                {Title}
                {UserDetailsInputs}
                {isView ?
                        <UserImageStyled src={user.userDetail.profilePicture} alt={'Avatar'} hasUpload={false}/>
                    :
                        Avatar
                }
            </FormSection>,
            <React.Fragment>
                <FormSection label={{value: 'credentials'}}>
                    {Credentials}
                </FormSection>
                <FormSection label={{value: 'user group'}}>
                    {UserGroupComponent}
                    {UserGroupTextarea}
                </FormSection>
            </React.Fragment>
        ]
    }
    return(
        <FormComponent {...data} isLoading={shouldFetchUser && gettingUser === API_REQUEST_STATE.START}/>
    );
})


export default withTheme(UserForm)