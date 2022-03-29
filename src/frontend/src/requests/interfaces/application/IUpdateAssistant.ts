import {AxiosResponse} from "axios";
import {IResponse} from "./IResponse";

export enum UpdateStatus{
    Old= 'old',
    Current= 'current',
    Available= 'available',
}

export interface OnlineUpdateProps{
    name: string,
    status: UpdateStatus,
}

export interface OfflineUpdateProps{
    name: string,
    status: UpdateStatus,
    folder: string,
    changelogLing: string,
}

export interface CheckForUpdateProps{
    version: string,
    hasUpdates: boolean,
}

export interface IUpdateAssistantRequest{

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