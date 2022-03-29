import {
    IUserDetailFile,
    IUserDetailRadios,
    IUserDetailSelect, IUserDetailSwitch,
    IUserDetailText
} from "@interface/user/IUserDetail";
import {IUserGroupFile, IUserGroupText, IUserGroupTextarea} from "@interface/usergroup/IUserGroup";

export interface IAuthUser{
    id: number,
    email: string,
    token: string,
    expTime: number,
    sessionTime: number,
    lastLogin: number,
    userGroup: IUserGroupFile & IUserGroupTextarea & IUserGroupText | any,
    userDetail: IUserDetailText & IUserDetailSelect & IUserDetailRadios & IUserDetailFile & IUserDetailSwitch | any,
    dashboard?: any,
}