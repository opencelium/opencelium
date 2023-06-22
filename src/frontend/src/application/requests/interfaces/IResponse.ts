/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

export enum ResponseMessages{
    'EXISTS'= 'EXISTS',
    'NOT_EXISTS'= 'NOT_EXISTS',
    'UNSUPPORTED_HEADER_AUTH_TYPE'= 'UNSUPPORTED_HEADER_AUTH_TYPE',
    'TOKEN_IS_NOT_VALID'= 'Full authentication is required to access this resource',
    'CONNECTOR_COMMUNICATION_FAILED'= 'COMMUNICATION_FAILED',
    'CONNECTOR_EXISTS'= 'CONNECTOR_ALREADY_EXISTS',
    'TITLE_EXISTS'= 'TITLE_EXISTS',
    'NETWORK_ERROR'= 'Network Error',
    'ACCESS_DENIED'= 'Access Denied',
    'SESSION_EXPIRED'= 'SESSION_EXPIRED'
}

export interface IResponse{
    error: string,
    message: string,
    path: string,
    status: number | string,
    timestamp: string,
}

export interface SettingsProps{
    withoutNotification?: boolean,
}

export interface IApplicationResponse<T>{
    data: T,
    settings: SettingsProps,
}
