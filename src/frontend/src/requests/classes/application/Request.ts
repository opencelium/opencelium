/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
import {IRequest, IRequestSettings} from "../../interfaces/application/IRequest";
import {baseUrl, baseUrlApi} from "./url";
import {LocalStorage} from "@class/application/LocalStorage";
import {IAuthUser} from "@interface/user/IAuthUser";

export class Request implements IRequest{
    url: string;
    isApi: boolean;
    isFormData: boolean;
    hasAuthToken: boolean;
    isFullUrl: boolean;
    isIframeUrl: boolean;
    endpoint: string;

    constructor(data: IRequestSettings) {
        this.url = data.url;
        this.isFormData = data.hasOwnProperty('isFormData') ? data.isFormData : false;
        this.isApi = data.hasOwnProperty('isApi') ? data.isApi : true;
        this.hasAuthToken = data.hasOwnProperty('hasAuthToken') ? data.hasAuthToken : true;
        this.isFullUrl = data?.isFullUrl || false;
        this.isIframeUrl = data?.isIframeUrl || false;
        this.endpoint = data?.endpoint || '';
    }

    private getUrl():string{
        let url = this.url;
        if(!this.isFullUrl){
            if(this.isApi){
                url = baseUrlApi + this.url;
            } else{
                url = baseUrl + this.url;
            }
            if(this.endpoint){
                url += `${this.endpoint}`;
            }
        }
        return url;
    }

    private getHeaders(settings?: AxiosRequestConfig):any{
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


    async get<T>(settings?: AxiosRequestConfig): Promise<AxiosResponse<T>>{
        return await axios.get<T>(this.getUrl(), {data: {}, ...settings, headers: this.getHeaders(settings)});
    }

    async post<T>(data: T | any, settings?: AxiosRequestConfig): Promise<AxiosResponse<T>>{
        return await axios.post<T>(this.getUrl(), data, {...settings, headers: this.getHeaders(settings)});
    }

    async put<T>(data: T | any, settings?: AxiosRequestConfig): Promise<AxiosResponse<T>>{
        return await axios.put<T>(this.getUrl(), data, {...settings, headers: this.getHeaders(settings)});
    }

    async delete<T>(settings?: AxiosRequestConfig): Promise<AxiosResponse<T>>{
        return await axios.delete<T>(this.getUrl(), {data: {}, ...settings, headers: this.getHeaders(settings)});
    }
}