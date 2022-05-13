import {AxiosResponse} from "axios";
import IUserDetail from "../../interfaces/IUserDetail";

export default interface IUserDetailRequest {

    //to update user detail
    updateUserDetail(userDetail: Partial<IUserDetail>): Promise<AxiosResponse<IUserDetail>>,

}