import {IForm} from "@interface/application/core";
import {UserState} from "@slice/UserSlice";
import { IUserGroup } from "../usergroup/IUserGroup";
import {OptionProps} from "@atom/input/select/interfaces";
import {IUserDetail} from "@interface/user/IUserDetail";

export interface IUserSwitch{
}

export interface IUserFile{
}
export interface IUserTextarea{
    userGroupDescription: string;
}

export interface IUserSelect{
    userGroupSelect: OptionProps;
}

export interface IUserRadios{
}

export interface IUserText{
    email: string;
    password: string;
    repeatPassword: string;
}


export interface IUserForm extends IUserText, IUserSelect, IUserRadios, IUserFile, IUserSwitch, IForm<IUserText, IUserSelect, IUserRadios, IUserFile, IUserTextarea, IUserSwitch>{
    getById: () => boolean;
    add: () => boolean;
    update: () => boolean;
    deleteById: () => boolean;
    uploadImage: () => boolean;
    deleteImage: () => boolean;
    checkEmail: () => boolean;
    reduxState?: UserState;
}
export interface IUser extends IUserForm{
    id?: number;
    userId?: number;
    userDetail: Partial<IUserDetail>,
    userGroup: IUserGroup,
    getFullName?: () => string,
}
