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

import {AxiosResponse} from "axios";
import {IResponse} from "./IResponse";

export enum UpdateStatus{
    Old= 'old',
    Current= 'current',
    Available= 'available',
}

export interface OnlineUpdateProps{
    name: string,
    version: string,
    status: UpdateStatus,
    instruction: string,
}

export interface OfflineUpdateProps{
    name: string,
    status: UpdateStatus,
    folder: string,
    changelogLink: string,
    instruction: string,
}

export interface CheckForUpdateProps{
    version: string,
    hasUpdates: boolean,
}

export interface IUpdateAssistantRequest{

    //to upload online version by version
    uploadOnlineVersion(): Promise<AxiosResponse<IResponse>>,

    //to get git versions of application based on tags
    getOnlineUpdates(): Promise<AxiosResponse<OnlineUpdateProps[]>>,

    //to get application versions stored locally as zip files
    getOfflineUpdates(): Promise<AxiosResponse<OfflineUpdateProps[]>>,

    //to upload an application as zip file
    uploadApplicationFile(application: FormData): Promise<AxiosResponse<IResponse>>,

    //to delete local application (zip file)
    deleteApplicationFile(): Promise<AxiosResponse<IResponse>>,

    //to check application if all set up for update
    checkApplicationBeforeUpdate(): Promise<AxiosResponse<IResponse>>,

    //to update application to a new version
    updateApplication(data: any): Promise<AxiosResponse<IResponse>>,
}
