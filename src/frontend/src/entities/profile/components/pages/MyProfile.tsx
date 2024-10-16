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

import React, {ChangeEvent, FC, useEffect, useState} from "react";
import {permission} from "@entity/application/utils/permission";
import {Auth} from "@application/classes/Auth";
import {useAppDispatch} from "@application/utils/store";
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


const MyProfile: FC<MyProfileListProps> = permission(MyProfilePermissions.READ)(({theme}) => {
    const dispatch = useAppDispatch();
    let {themes} = Application.getReduxState();
    if(!themes || !isArray(themes) || themes.length === 0){
        themes = DefaultThemes;
    }
    const {authUser} = Auth.getReduxState();
    const [themeSync, setThemeSync] = useState<boolean>(authUser?.userDetail?.themeSync || false);
    useEffect(() => {
        setThemeSync(authUser.userDetail.themeSync);
    }, [authUser.userDetail])
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
    const isOnline = authUser?.userDetail?.themeSync || false;
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
    const data = {
        title: 'My Profile',
        formSections: [
            <FormSection label={{value: 'user details'}}>
                {Avatar}
                {Title}
                {UserDetailsInputs}
                {Email}
            </FormSection>,
            <React.Fragment>
                <FormSection label={{value: 'user group'}}>
                    {Permissions}
                </FormSection>
                <FormSection label={{value: 'settings'}}>
                    <div style={{position: 'relative'}}>
                        <InputSelect
                            icon={'palette'}
                            label={'Theme'}
                            options={themesOptions}
                            value={selectedTheme}
                            onChange={selectTheme}
                        />
                    </div>
                    <InputSwitch
                        name={`All online services are ${themeSync ? 'enabled' : 'disabled'} (Gravatar, Online Update, Theme)`}
                        icon={'corporate_fare'}
                        label={'Online Service Sync'}
                        isChecked={themeSync} onClick={() => dispatch(updateUserDetail({...authUser, userDetail: {...authUser.userDetail, themeSync: !themeSync}}))}
                        hasConfirmation={true}
                        confirmationText={'Are you agree to share your E-mail with Opencelium Service Portal?'}
                    />
                </FormSection>
            </React.Fragment>
        ]
    }
    return(
        <Form {...data}/>
    )
})

export default withTheme(MyProfile);
