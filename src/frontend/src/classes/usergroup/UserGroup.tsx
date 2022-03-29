import React, {ReactElement, ReactNodeArray} from "react";
import {HookStateClass} from "../application/HookStateClass";
import {Application as App} from "../application/Application";
import {IUserGroup, IUserGroupFile, IUserGroupSelect, IUserGroupText, IUserGroupTextarea} from "@interface/usergroup/IUserGroup";
import {IInput} from "@interface/application/core";
import {InputTextProps} from "@atom/input/text/interfaces";
import {InputSelectProps, OptionProps} from "@atom/input/select/interfaces";
import {InputFileProps} from "@atom/input/file/interfaces";
import {InputTextareaProps} from "@atom/input/textarea/interfaces";
import {RootState} from "@store/store";
import {
    ComponentProps,
    PermissionProps,
    PermissionsProps
} from "@molecule/form_section/permissions/interfaces";
import {Permissions} from "@molecule/form_section/permissions/Permissions";
import {UserGroupState} from "@slice/UserGroupSlice";
import {addUserGroup, deleteUserGroupById, getUserGroupById, updateUserGroup} from "@action/UserGroupCreators";
import {useAppDispatch, useAppSelector} from "../../hooks/redux";


export class UserGroup extends HookStateClass implements IUserGroup{
    id: number;

    static reduxState?: UserGroupState;

    @App.inputType
    name: string;

    @App.inputType
    description: string;

    @App.inputType
    iconFile: FileList;

    @App.inputType
    componentsSelect: OptionProps[];

    @App.inputTypeWithDependencies(['refreshPermissions'])
    permissions: PermissionProps;

    components: ComponentProps[];

    icon: string = '';
    shouldDeleteIcon?: boolean = false;

    constructor(userGroup?: Partial<IUserGroup> | null) {
        // @ts-ignore
        super(userGroup?.validations || {}, userGroup?._readOnly, userGroup?.wholeInstance);
        this.id = userGroup?.id || userGroup?.userGroupId || userGroup?.groupId || 0;
        this.name = userGroup?.name || '';
        this.description = userGroup?.description || '';
        this.iconFile = userGroup?.iconFile || null;
        this.icon = userGroup?.icon || '';
        this.componentsSelect = userGroup?.componentsSelect || [];
        this.components = userGroup?.components || [];
        if(this.componentsSelect.length === 0 && this.components?.length > 0){
            this.componentsSelect = this.components.map(component => {return {label: component.name, value: component.componentId.toString(), permissions: component.permissions}});
        }
        this.permissions = userGroup?.permissions || {};
        this.shouldDeleteIcon = userGroup?.shouldDeleteIcon || false;
        this.refreshPermissions();
        // @ts-ignore
        this.dispatch = userGroup.dispatch ? userGroup.dispatch : useAppDispatch();
    }

    static createState<T>(args?: Partial<IUserGroup>, observation?: any):T{
        const observations = [{functionName: 'updateState', value: observation}];
        return super.createState<IUserGroup>(
            UserGroup,
            (state: RootState) => state.userGroupReducer,
            args,
            observations);
    }

    static getReduxState(){
        return useAppSelector((state: RootState) => state.userGroupReducer);
    }

    refreshPermissions(){
        for(let i = 0; i < this.componentsSelect.length; i++){
            if(!this.permissions.hasOwnProperty(this.componentsSelect[i].label)){
                // @ts-ignore
                this.permissions[this.componentsSelect[i].label] = this.componentsSelect[i]?.permissions || [];
            }
        }
    }

    getText(data: IInput<IUserGroupText, InputTextProps>):ReactElement{
        return super.getInputText<IUserGroupText, InputTextProps>(data);
    }

    getTexts(data: IInput<IUserGroupText, InputTextProps>[]):ReactNodeArray{
        return super.getInputTexts<IUserGroupText, InputTextProps>(data);
    }

    getSelect(data: IInput<IUserGroupSelect, InputSelectProps>):ReactElement{
        return super.getInputSelect<IUserGroupSelect, InputSelectProps>(data);
    }

    getFile(data: IInput<IUserGroupFile, InputFileProps>): ReactElement {
        data.props.onToggleHasImage = (hasImage: boolean) => {
            this.shouldDeleteIcon = hasImage;
            // @ts-ignore
            this.updateIconFile(this, this.iconFile);
        }
        data.props.hasNoImage = this.shouldDeleteIcon;
        data.props.hasCheckbox = true;
        return super.getInputFile<IUserGroupFile, InputFileProps>(data);
    }

    getTextarea(data: IInput<IUserGroupTextarea, InputTextareaProps>): ReactElement {
        return super.getInputTextarea<IUserGroupTextarea, InputTextareaProps>(data);
    }

    getPermissionComponent(props?: PermissionsProps){
        // @ts-ignore
        let validationMessage = this.validations['permissions'] || '';
        return(
            <Permissions
                id={'input_permissions'}
                required={true}
                readOnly={this._readOnly}
                error={validationMessage}
                icon={'lock_open'}
                label={'Permissions'}
                permissions={this.permissions}
                components={this.componentsSelect}
                onChange={(permissions: any) => {
                    // @ts-ignore
                    this.updatePermissions(this, {...permissions});
                }}
                {...props}
            />
        )
    }

    validateName(): boolean{
        let isNotValid = false;
        if(this.name === ''){
            isNotValid = true;
            this.validations['name'] = 'The name is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateName(this, this.name);
            if(!this.isFocused){
                document.getElementById('input_name').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateComponentsSelect(): boolean{
        let isNotValid = false;
        if(this.componentsSelect.length === 0){
            isNotValid = true;
            this.validations['componentsSelect'] = 'The components is a required field';
        }
        if(isNotValid){
            // @ts-ignore
            this.updateComponentsSelect(this, this.componentsSelect);
            if(!this.isFocused){
                document.getElementById('input_componentsSelect').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validatePermissions(): boolean{
        let isNotValid = true;
        for(const param in this.permissions){
            if(this.permissions[param].length !== 0){
                isNotValid = false;
                break;
            }
        }
        if(isNotValid){
            this.validations['permissions'] = 'The permissions is a required field';
            // @ts-ignore
            this.updatePermissions(this, this.permissions);
            if(!this.isFocused){
                document.getElementById('input_permissions').focus();
                this.isFocused = true;
            }
            return false;
        }
        return true;
    }

    validateAdd(){
        this.isFocused = false;
        const isValidName = this.validateName();
        const isValidComponentsSelect = this.validateComponentsSelect();
        const isValidPermissions = this.validatePermissions();
        return isValidName && isValidComponentsSelect && isValidPermissions;
    }

    @App.dispatch(getUserGroupById, {mapping: (userGroup: IUserGroup) => {return userGroup.id;}, hasNoValidation: true})
    getById(): boolean{
        return this.validateId(this.id);
    }

    @App.dispatch(addUserGroup)
    add(): boolean{
        return this.validateAdd();
    }

    @App.dispatch(updateUserGroup)
    update(): boolean{
        return this.validateId(this.id) && this.validateAdd();
    }

    @App.dispatch<IUserGroup>(deleteUserGroupById, {hasNoValidation: true})
    deleteById(): boolean{
        return true;
    }
}