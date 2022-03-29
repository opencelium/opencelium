import React, {FC} from "react";
import {User} from "@class/user/User";
import FormSection from "@organism/form_section/FormSection";
import Form from "@organism/form/Form";
import {UserDetail} from "@class/user/UserDetail";
import {IUserDetail, UserTitle} from "@interface/user/IUserDetail";
import {UserGroup} from "@class/usergroup/UserGroup";
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import { MyProfileListProps } from "./interfaces";
import {permission} from "../../../decorators/permission";
import {MyProfilePermissions} from "@constants/permissions";
import {Auth} from "@class/application/Auth";
import {useAppDispatch} from "../../../hooks/redux";
import {updateAuthUserDetail} from "@action/application/AuthCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";


const MyProfile: FC<MyProfileListProps> = permission(MyProfilePermissions.READ)(({}) => {
    const dispatch = useAppDispatch();
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
    const Theme = userDetail.getRadios({
        propertyName: 'theme', props: {
            readOnly: false,
            icon: 'preview',
            label: 'Themes',
            options: [
                {label: 'Default', value: 'default', key: 'default'},
                {label: 'Green Day', value: 'other', key: 'other'}
            ],
            callback: (e: any) => {
                let updatedAuthUser = {...authUser, userDetail: {...authUser.userDetail}};
                updatedAuthUser.userDetail.theme = e.target.value;
                dispatch(updateAuthUserDetail(updatedAuthUser));
            },
            isLoading: updatingAuthUser === API_REQUEST_STATE.START
        }
    });
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