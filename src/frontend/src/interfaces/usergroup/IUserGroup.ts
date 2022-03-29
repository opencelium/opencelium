import {IForm} from "@interface/application/core";
import {
    ComponentProps,
    PermissionProps,
    PermissionsProps
} from "@molecule/form_section/permissions/interfaces";
import {UserGroupState} from "@slice/UserGroupSlice";
import {OptionProps} from "@atom/input/select/interfaces";


export interface IUserGroupFile{
    iconFile: FileList;
}
export interface IUserGroupTextarea{
    description: string;
}

export interface IUserGroupSelect{
    componentsSelect: OptionProps[];
}

export interface IUserGroupText{
    name: string;
}


export interface IUserGroupForm extends IUserGroupText, IUserGroupTextarea, IUserGroupSelect, IUserGroupFile, IForm<IUserGroupText, IUserGroupSelect, {}, IUserGroupFile, IUserGroupTextarea, {}>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
    reduxState?: UserGroupState;
}
export interface IUserGroup extends IUserGroupForm{
    id?: number;
    userGroupId?: number,
    groupId?: number,
    components: ComponentProps[],
    permissions: PermissionProps,
    getPermissionComponent: (props?: PermissionsProps) => {},
    shouldDeleteIcon?: boolean,
    icon?: string,
}
