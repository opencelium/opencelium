import {AxiosResponse} from "axios";
import {ITicket} from "@interface/application/ITicket";
import {IResponse} from "./IResponse";
import {IComponent} from "@interface/application/IComponent";
import {REQUEST_METHOD} from "./IRequest";

export interface ApplicationVersionResponseProps{
    /*
    * version of the application
    * template: v[number].[number]?.[number]
    */
    version: string,
}

export type ComponentName = 'connection' | 'connector' | 'scheduler';

export enum ComponentRoutes{
    connection= 'connections',
    connector= 'connectors',
    scheduler= 'schedules',
}

export interface SingleSearchResult{

    //id of the corresponded component
    id: number,

    //title of the corresponded component
    title: string,

    //component name
    components: ComponentName,
}

export interface GlobalSearchResponseProps{
    result: SingleSearchResult[],
}

export interface ResourcesProps{

    //filenames of new invokers and templates
    files_name: string[],
}

export interface RemoteApiRequestProps{
    url: string,
    header: any,
    method: REQUEST_METHOD,
    body: any,
}

export interface RemoteApiResponseProps{
    body: any,
    headers: any,
    statusCode: string,
    statusCodeValue: number,
}

export interface IApplicationRequest{

    //to make an external request
    remoteApiRequest(data: RemoteApiRequestProps): Promise<AxiosResponse<RemoteApiResponseProps>>,

    //to add ticket when an error occurs on the frontend/backend
    addTicket(ticket: ITicket): Promise<AxiosResponse<IResponse>>,

    //to get an application version
    getVersion(): Promise<AxiosResponse<ApplicationVersionResponseProps>>,

    //to get new invokers and templates
    getResources(): Promise<AxiosResponse<ResourcesProps>>,

    //to get data using in global search
    getGlobalSearchData(): Promise<AxiosResponse<GlobalSearchResponseProps>>,

    //to get all components
    getAllComponents(): Promise<AxiosResponse<IComponent[]>>,

    //to update application with new invokers and templates
    updateResources(): Promise<AxiosResponse<IResponse>>,

    //to open an external link
    openExternalUrl(): Promise<AxiosResponse<IResponse>>,
}