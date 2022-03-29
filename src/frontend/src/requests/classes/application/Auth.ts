import {Request} from "./Request";
import {AxiosResponse} from "axios";
import { IUser } from "@interface/user/IUser";
import { IAuth } from "../../interfaces/application/IAuth";
import {ICredentials} from "@interface/application/IAuth";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {LocalStorage} from "@class/application/LocalStorage";
import {IUserDetail} from "@interface/user/IUserDetail";
import {UserDetailRequest} from "@request/user/UserDetail";

export class AuthRequest extends Request implements IAuth{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: '', ...settings});
    }

    async updateAuthUserDetail(userDetail: Partial<IUserDetail>): Promise<AxiosResponse<IUserDetail>>{
        return super.put<IUserDetail>(UserDetailRequest.backendMap(userDetail));
    }

    async login(credentials: ICredentials): Promise<AxiosResponse<IUser>>{
        this.url = 'login';
        return super.post<IUser>(credentials);
    }

    logout():void{
        const storage = LocalStorage.getStorage(true);
        storage.remove('authUser');
    }
}