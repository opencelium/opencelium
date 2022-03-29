import {AxiosRequestConfig, AxiosResponse} from "axios";

export enum REQUEST_METHOD{
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

export interface IRequestSettings{
    url: string,
    //end part of the url
    endpoint?: string,
    //true for api request
    isApi?: boolean,

    //true if request contains FormData
    isFormData?: boolean,

    //true for external request
    isFullUrl?: boolean,
    isIframeUrl?: boolean,

    //true for request with token in the header
    hasAuthToken?: boolean,
}

export interface IRequest extends IRequestSettings{
    get<T>(settings: AxiosRequestConfig): Promise<AxiosResponse<T>>,
    post<T>(data: T, settings: AxiosRequestConfig): Promise<AxiosResponse<T>>,
    put<T>(data: T, settings: AxiosRequestConfig): Promise<AxiosResponse<T>>,
    delete<T>(settings: AxiosRequestConfig): Promise<AxiosResponse<T>>,
}