import {AxiosRequestConfig} from "axios";
import {LocalStorage} from "@application/classes/LocalStorage";
import {Request as ApplicationRequest} from "@application//requests/classes/Request";
import IAuthUser from "@entity/user/interfaces/IAuthUser";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";

export default class Request extends ApplicationRequest{

    constructor(data: IRequestSettings) {
        super(data);
    }

    getHeaders(settings?: AxiosRequestConfig):any{
        let headers: any = {
            'crossDomain': true,
            'timeout': 10000,
            'content-type': 'application/json',
        };
        if(this.hasAuthToken){
            const storage = LocalStorage.getStorage(true);
            let authUser: IAuthUser = storage.get('authUser')
            if(authUser) {
                const {lastLogin, expTime, sessionTime} = authUser;
                if (lastLogin !== null) {
                    const currentLogin = Date.now();
                    if (currentLogin - lastLogin >= sessionTime || currentLogin >= expTime) {
                        storage.remove('authUser');
                    } else {
                        authUser.lastLogin = Date.now();
                        storage.set('authUser', authUser);
                        headers['Authorization'] = authUser.token;
                    }
                }
            }
        }
        if(this.isFormData){
            headers['content-type'] = 'multipart/form-data';
        }
        if(settings?.headers){
            headers = {
                ...headers,
                ...settings.headers
            };
        }
        return headers;
    }
}