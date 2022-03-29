import {AxiosResponse} from "axios";
import {IUser} from "@interface/user/IUser";
import {ICredentials} from "@interface/application/IAuth";
import {IUserDetail} from "@interface/user/IUserDetail";

interface IAuth{

    //to update an authorized user
    updateAuthUserDetail(authUser: Partial<IUserDetail>): Promise<AxiosResponse<IUserDetail>>,

    //to login into the application
    login(credentials: ICredentials): Promise<AxiosResponse<IUser>>,

    //to logout from the application
    logout(): void,
}

export {
    IAuth,
}