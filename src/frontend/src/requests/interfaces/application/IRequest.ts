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

import {AxiosRequestConfig, AxiosResponse} from "axios";

export interface IEntityWithImage<T>{
    entityData: T,
    iconFile: any,
    shouldDeleteIcon: boolean,
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