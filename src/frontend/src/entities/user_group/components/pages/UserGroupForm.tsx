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

import React, {FC, useEffect, useRef} from "react";
import {useNavigate, useParams} from "react-router";
import {useAppDispatch} from "@application/utils/store";
import {Application} from "@application/classes/Application";
import {IForm} from "@application/interfaces/IForm";
import {Form} from "@application/classes/Form";
import {getAllComponents} from "@application/redux_toolkit/action_creators/ApplicationCreators";
import {capitalize} from "@application/utils/utils";
import {API_REQUEST_STATE, IComponent, TRIPLET_STATE} from "@application/interfaces/IApplication";
import Button from "@app_component/base/button/Button";
import FormComponent from "@app_component/form/form/Form";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import FormSection from "@app_component/form/form_section/FormSection";
import {UserGroup} from "../../classes/UserGroup";
import {IUserGroup} from "../../interfaces/IUserGroup";

const UserGroupForm: FC<IForm> = ({isAdd, isUpdate, isView}) => {
    const dispatch = useAppDispatch();
    const didMount = useRef(false);
    let navigate = useNavigate();
    let urlParams = useParams();
    const {components, gettingComponents} = Application.getReduxState();
    const componentOptions: OptionProps[] = components.map((component: IComponent) => {
        return {
            value: `${component.componentId}`,
            label: capitalize(component.name.toLowerCase()),
        };
    })
    const shouldFetchUserGroup = isUpdate || isView;
    const form = new Form({isView, isAdd, isUpdate});
    const formData = form.getFormData('group');
    let userGroupId = 0;
    if(shouldFetchUserGroup){
        userGroupId = parseInt(urlParams.id);
    }
    const {error, addingUserGroup, updatingUserGroup, currentUserGroup, isCurrentUserGroupHasUniqueName, checkingUserGroupName} = UserGroup.getReduxState();
    const userGroup = UserGroup.createState<IUserGroup>({id: userGroupId, _readOnly: isView}, isAdd ? null : currentUserGroup);
    useEffect(() => {
        if(shouldFetchUserGroup){
            userGroup.getById()
        }
        dispatch(getAllComponents());
    },[]);
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (isAdd && addingUserGroup === API_REQUEST_STATE.FINISH || isUpdate && updatingUserGroup === API_REQUEST_STATE.FINISH)){
                navigate('/usergroups', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingUserGroup, updatingUserGroup]);
    const NameInput = userGroup.getText({
        propertyName: "name", props: {autoFocus: !isView, required: true, icon: 'person', label: 'Name', isLoading: checkingUserGroupName === API_REQUEST_STATE.START, error: isCurrentUserGroupHasUniqueName === TRIPLET_STATE.FALSE ? 'The name is already in use' : ''}
    })
    const DescriptionInput = userGroup.getTextarea({
        propertyName: "description", props: {icon: "notes", label: "Description"}
    })
    const Avatar = userGroup.getFile({propertyName: "iconFile", props: {label: "Icon",}});
    const Components = userGroup.getSelect({propertyName: 'componentsSelect', props: {
        icon: 'view_carousel',
        label: 'Components',
        options: componentOptions,
        isMultiple: true,
        required: true,
        isLoading: gettingComponents === API_REQUEST_STATE.START,
    }})
    const Permissions = userGroup.getPermissionComponent();
    let actions = [<Button
        autoFocus={isView}
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/usergroups'}
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => userGroup.add() : () => userGroup.update();
        actions.unshift(<Button
            key={'action_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={isAdd && addingUserGroup === API_REQUEST_STATE.START || isUpdate && updatingUserGroup === API_REQUEST_STATE.START}
        />);
    }
    const data = {
        title: [{name: 'Admin Panel', link: '/admin_cards'}, {name: 'User Groups', link: '/usergroups'}, {name: formData.formTitle}],
        actions: actions,
        formSections: [
            <FormSection label={{value: 'user details'}}>
                {NameInput}
                {DescriptionInput}
                {!isView && Avatar}
            </FormSection>,
            <React.Fragment>
                <FormSection label={{value: 'credentials'}}>
                    {Components}
                </FormSection>
                <FormSection label={{value: 'user group'}} dependencies={[userGroup.componentsSelect.length === 0]}>
                    {Permissions}
                </FormSection>
            </React.Fragment>
        ]
    }
    return(
        <FormComponent {...data}/>
    )
}

export default UserGroupForm
