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

import React, {ChangeEvent, FC, useEffect} from "react";
import {User} from "@class/user/User";
import FormSection from "@organism/form_section/FormSection";
import Form from "@organism/form/Form";
import {UserDetail} from "@class/user/UserDetail";
import {IUserDetail} from "@interface/user/IUserDetail";
import {UserGroup} from "@class/usergroup/UserGroup";
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import { MyProfileListProps } from "./interfaces";
import {permission} from "../../../decorators/permission";
import {MyProfilePermissions} from "@constants/permissions";
import {Auth} from "@class/application/Auth";
import {useAppDispatch} from "../../../hooks/redux";
import {updateAuthUserDetail} from "@action/application/AuthCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {Application} from "@class/application/Application";
import { setTheme } from "@store/reducers/application/ApplicationSlice";
import InputRadios from "@atom/input/radio/InputRadios";


const MyProfile: FC<MyProfileListProps> = permission(MyProfilePermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
    const {theme} = Application.getReduxState();
    const {authUser, updatingAuthUser} = Auth.getReduxState();
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
    const Theme =
        <InputRadios
            onChange={(e:ChangeEvent<HTMLInputElement>) => {
                // @ts-ignore
                dispatch(setTheme(e.target.value));
            }}
            value={theme}
            icon={'preview'}
            label={'Themes'}
            options={[
                {label: 'Default', value: 'default', key: 'default'},
                {label: 'Green Day', value: 'other', key: 'other'},
                {label: 'Becon Classic', value: 'becon_classic', key: 'becon_classic'}
            ]}
        />
    const AppTour = userDetail.getSwitch({propertyName: 'appTour', props:{
        readOnly: false,
        icon: 'help_center',
        label: 'Application Tour'
    }})
    const data = {
        title: 'My Profile',
        formSections: [
            <FormSection label={{value: 'user details'}}>
                {UserDetailsInputs}
                {Email}
            </FormSection>,
            <React.Fragment>
                <FormSection label={{value: 'user group'}}>
                    {Permissions}
                </FormSection>
                <FormSection label={{value: 'settings'}}>
                    {Theme}
                    {/*{AppTour}*/}
                </FormSection>
            </React.Fragment>
        ]
    }
    return(
        <Form {...data}/>
    )
})

export default MyProfile