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

import React, {ChangeEvent, FC, useEffect, useMemo, useState} from "react";
import {permission} from "@entity/application/utils/permission";
import {Auth} from "@application/classes/Auth";
import {useAppDispatch, useAppSelector} from "@application/utils/store";
import {Application} from "@application/classes/Application";
import { setThemes } from "@application/redux_toolkit/slices/ApplicationSlice";
import FormSection from "@app_component/form/form_section/FormSection";
import Form from "@app_component/form/form/Form";
import {UserGroup} from "@entity/user_group/classes/UserGroup";
import {IUserGroup} from "@entity/user_group/interfaces/IUserGroup";
import IUserDetail from "@entity/user/interfaces/IUserDetail";
import UserDetail from "@entity/user/classes/UserDetail";
import User from "@entity/user/classes/User";
import { MyProfileListProps } from "./interfaces";
import { MyProfilePermissions } from "../../constants";
import InputSelect from "@app_component/base/input/select/InputSelect";
import {ColorTheme, DefaultTheme, DefaultThemes} from "@style/Theme";
import InputSwitch from "@app_component/base/input/switch/InputSwitch";
import { updateUserDetail } from "@entity/user/redux-toolkit/action_creators/UserDetailCreators";
import {ProfileImageStyled, DefaultImageStyled} from "./styles";
import {withTheme} from "styled-components";
import AvatarDefault from "@image/application/avatar_default.png";
import {isArray} from "@application/utils/utils";
import {FormProps} from "@app_component/form/form/interfaces";
import { API_REQUEST_STATE } from '@application/interfaces/IApplication';
import { updatePassword } from '@entity/user/redux-toolkit/action_creators/UserCreators';
import Button from '@app_component/base/button/Button';
import InputText from '@app_component/base/input/text/InputText';
import { InputTextType } from '@app_component/base/input/text/interfaces';


const MyProfile: FC<MyProfileListProps> = permission(MyProfilePermissions.READ)(({theme}) => {
    const dispatch = useAppDispatch();
    let {themes, onlineServiceStatus} = Application.getReduxState();
    if(!themes || !isArray(themes) || themes.length === 0){
        themes = DefaultThemes;
    }
    const {authUser} = Auth.getReduxState();
    const userGroup = UserGroup.createState<IUserGroup>({
        _readOnly: true,
        ...authUser.userGroup,
    })
    const userDetail = UserDetail.createState<IUserDetail>({
        _readOnly: true,
        ...authUser.userDetail,
    });
    const user = new User({
        _readOnly: true,
        id: authUser.id,
        userDetail,
        email: authUser.email,
    });
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
        {propertyName: "phoneNumber", props: {icon: "phone", label: "Phone Number", required: true}},
    ]);
    const Email = user.getText(
        {propertyName: "email", props: {icon: 'email', label: "Email", maxLength: 255, required: true}},
    );
    const Permissions = userGroup.getPermissionComponent();
    const themesOptions = themes.map(theme => {
        return {
            label: theme.name,
            value: theme.name,
        };
    });
    const currentTheme = themes.find(theme => theme.isCurrent) || DefaultTheme;
    const [selectedTheme, setSelectedTheme] = useState({label: currentTheme.name, value: currentTheme.name});
    const selectTheme = (selectedOption: any) => {
        let newThemes = [...themes].map(theme => {
            let newTheme = {...theme};
            if(newTheme.name === selectedOption.value){
                newTheme.isCurrent = true;
            } else{
                newTheme.isCurrent = false;
            }
            return newTheme;
        })
        setSelectedTheme(selectedOption);
        // @ts-ignore
        dispatch(setThemes(JSON.stringify(newThemes)));
    }
    const isOnline = !!onlineServiceStatus?.active;
    //TODO - Move Gravatar to external component
    const Avatar = isOnline ?
        <ProfileImageStyled
            email={user.email}
            size={100}
            rating="pg"
            default="mm"
            title={'Avatar'}
            style={{borderRadius: '50%', border: `1px solid ${theme.menu.background}`}}
            protocol="https://"
        />
        :
        <DefaultImageStyled
            alt={'Avatar'}
            src={AvatarDefault}
            style={{width: '100px', height: '100px', cursor: 'pointer', borderRadius: '50%', border: `1px solid ${theme.menu.background}`}}
        />;

    const { updatingPassword } = useAppSelector((s) => s.userReducer);
    const isUpdatingPassword = updatingPassword === API_REQUEST_STATE.START;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordTouched, setPasswordTouched] = useState(false);

    const passwordValidationError = useMemo(() => {
        if (!currentPassword && !newPassword && !confirmPassword) return '';
        if (!currentPassword || !newPassword || !confirmPassword) return 'Please fill all password fields.';
        if (newPassword.length < 8) return 'New password must be at least 8 characters.';
        if (newPassword !== confirmPassword) return 'Passwords do not match.';
        if (currentPassword === newPassword) return 'New password must be different from current password.';
        return '';
    }, [currentPassword, newPassword, confirmPassword]);

    const currentPasswordError = useMemo(() => {
        if (!passwordTouched) return '';
        if (passwordValidationError === 'Please fill all password fields.' && !currentPassword) {
            return 'Please fill current password.';
        }
        return '';
    }, [passwordTouched, passwordValidationError, currentPassword]);

    const newPasswordError = useMemo(() => {
        if (!passwordTouched) return '';
        if (passwordValidationError === 'Please fill all password fields.' && !newPassword) {
            return 'Please fill new password.';
        }
        if (passwordValidationError === 'New password must be at least 8 characters.') {
            return passwordValidationError;
        }
        if (passwordValidationError === 'New password must be different from current password.') {
            return passwordValidationError;
        }
        return '';
    }, [passwordTouched, passwordValidationError, newPassword]);

    const confirmPasswordError = useMemo(() => {
        if (!passwordTouched) return '';
        if (passwordValidationError === 'Please fill all password fields.' && !confirmPassword) {
            return 'Please confirm new password.';
        }
        if (passwordValidationError === 'Passwords do not match.') {
            return passwordValidationError;
        }
        return '';
    }, [passwordTouched, passwordValidationError, confirmPassword]);

    const onUpdatePassword = () => {
        setPasswordTouched(true);
        if (passwordValidationError) return;

        dispatch(updatePassword({
            currentPassword,
            newPassword,
        }) as any).then((res: any) => {
            if (res && res.type && String(res.type).includes('fulfilled')) {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordTouched(false);
            }
        });
    };

    const data: FormProps = {
        entityKey: 'profile-form',
        title: 'My Profile',
        formSections: [
            <React.Fragment>
                <FormSection label={{value: 'user details'}} id={'profile-form-user-details'}>
                    {Avatar}
                    {Title}
                    {UserDetailsInputs}
                    {Email}
                </FormSection>
                <FormSection label={{ value: 'update password' }} id={'profile-form-update-password'}>
                    <InputText
                        icon={'lock'}
                        label={'Current password'}
                        type={InputTextType.Password}
                        value={currentPassword}
                        onChange={(e: any) => setCurrentPassword(e.target.value)}
                        maxLength={255}
                        required={true}
                        error={currentPasswordError}
                    />
                    <InputText
                        icon={'lock'}
                        label={'New password'}
                        type={InputTextType.Password}
                        value={newPassword}
                        onChange={(e: any) => setNewPassword(e.target.value)}
                        maxLength={255}
                        required={true}
                        error={newPasswordError}
                    />
                    <InputText
                        icon={'lock'}
                        label={'Confirm new password'}
                        type={InputTextType.Password}
                        value={confirmPassword}
                        onChange={(e: any) => setConfirmPassword(e.target.value)}
                        maxLength={255}
                        required={true}
                        error={confirmPasswordError}
                    />

                    <div style={{ position: 'absolute', right: 0, bottom: '-40px' }}>
                        <Button
                            label={isUpdatingPassword ? 'Updating...' : 'Update'}
                            isDisabled={
                                isUpdatingPassword ||
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword ||
                                !!passwordValidationError
                            }
                            isLoading={isUpdatingPassword}
                            handleClick={onUpdatePassword}
                        />
                    </div>
                </FormSection>
            </React.Fragment>,
            <React.Fragment>
                <FormSection label={{value: 'settings'}} id={'profile-form-settings'}>
                    <div style={{position: 'relative'}}>
                        <InputSelect
                            icon={'palette'}
                            label={'Theme'}
                            options={themesOptions}
                            value={selectedTheme}
                            onChange={selectTheme}
                        />
                    </div>
                </FormSection>
                <FormSection label={{value: 'Permissions'}} id={'profile-form-permissions'}>
                    {Permissions}
                </FormSection>
            </React.Fragment>
        ]
    }
    return(
        <Form {...data}/>
    )
})

export default withTheme(MyProfile);
