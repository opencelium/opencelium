import {AxiosResponse} from "axios";
import { IUserGroup } from "@interface/usergroup/IUserGroup";
import {IResponse} from "../application/IResponse";

export interface IUserGroupRequest{

    //to check if user group with such name already exists
    checkUserGroupName(): Promise<AxiosResponse<IResponse>>,

    //to get user group by id
    getUserGroupById(): Promise<AxiosResponse<IUserGroup>>,

    //to get all user groups of authorized user
    getAllUserGroups(): Promise<AxiosResponse<IUserGroup[]>>,

    //to add user group
    addUserGroup(userGroup: IUserGroup): Promise<AxiosResponse<IUserGroup>>,

    /*
    * TODO: check update on the server
    */
    //to update user group
    updateUserGroup(userGroup: IUserGroup): Promise<AxiosResponse<IUserGroup>>,

    //to delete user group by id
    deleteUserGroupById(): Promise<AxiosResponse<IUserGroup>>,

    //to delete user groups by id
    deleteUserGroupsById(userGroup: number[]): Promise<AxiosResponse<number[]>>,

    //to upload image of user group
    uploadUserGroupImage(data: FormData): Promise<AxiosResponse<any>>,

    //to delete image of user group
    deleteUserGroupImage(): Promise<AxiosResponse<any>>,
}