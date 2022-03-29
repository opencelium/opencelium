import React, {FC, useEffect, useRef} from "react";
import {UserGroup} from "@class/usergroup/UserGroup";
import Button from "@atom/button/Button";
import FormSection from "@organism/form_section/FormSection";
import FormComponent from "@organism/form/Form";
import {IUserGroup} from "@interface/usergroup/IUserGroup";
import {useAppDispatch} from "../../../hooks/redux";
import {Application} from "@class/application/Application";
import {useNavigate, useParams} from "react-router";
import {IForm} from "@interface/application/IForm";
import {Form} from "@class/application/Form";
import {getAllComponents} from "@action/application/ApplicationCreators";
import {OptionProps} from "@atom/input/select/interfaces";
import {IComponent} from "@interface/application/IComponent";
import {capitalize} from "@utils/app";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";

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
            if(error === null && (addingUserGroup === API_REQUEST_STATE.FINISH || updatingUserGroup === API_REQUEST_STATE.FINISH)){
                navigate('/usergroups', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingUserGroup, updatingUserGroup]);
    const NameInput = userGroup.getText({
        propertyName: "name", props: {autoFocus: true, required: true, icon: 'person', label: 'Name', isLoading: checkingUserGroupName === API_REQUEST_STATE.START, error: isCurrentUserGroupHasUniqueName === TRIPLET_STATE.FALSE ? 'The name must be unique' : ''}
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
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/usergroups'}
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => userGroup.add() : () => userGroup.update();
        actions.unshift(<Button
            key={'add_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={addingUserGroup === API_REQUEST_STATE.START}
        />);
    }
    const data = {
        title: [{name: 'Admin Cards', link: '/admin_cards'}, {name: formData.formTitle}],
        actions: actions,
        formSections: [
            <FormSection label={{value: 'user details'}}>
                {NameInput}
                {DescriptionInput}
                {Avatar}
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