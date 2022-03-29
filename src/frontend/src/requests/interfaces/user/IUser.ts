import {AxiosResponse} from "axios";
import {IUser} from "@interface/user/IUser";
import {IResponse} from "../application/IResponse";

export interface IUserRequest{

    //to check if user with such email already exists
    checkUserEmail(): Promise<AxiosResponse<IResponse>>,

    //to get user by id
    getUserById(): Promise<AxiosResponse<IUser>>,

    //to get all users of authorized user
    getAllUsers(): Promise<AxiosResponse<IUser[]>>,

    //to add user
    addUser(user: IUser): Promise<AxiosResponse<IUser>>,

    //to update user
    updateUser(user: IUser): Promise<AxiosResponse<IUser>>,

    //to delete user by id
    deleteUserById(): Promise<AxiosResponse<IResponse>>,

    //to delete users by id
    deleteUsersById(user: number[]): Promise<AxiosResponse<number[]>>,

    //to upload image of user
    uploadUserImage(data: FormData): Promise<AxiosResponse<any>>,

    /*
    * TODO: do not exist suck method on the server
    */
    //to delete image of user
    deleteUserImage(): Promise<AxiosResponse<any>>,
}