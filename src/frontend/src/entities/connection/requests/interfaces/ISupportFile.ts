import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";

export interface SupportFileResponse {
    connectionId: number,
    connectionTitle: string,
    status: SupportFileStatus,
    supportFile: string,
}

export enum SupportFileStatus {
    ConnectionFound= 'CONNECTION_FOUND',
}

export type SupportFileResponseProps = keyof SupportFileResponse | string;

export type DeleteSupportFilesRequest = {
    filenames: string[],
}

export default interface ISupportFileRequest {
    //to download support file by connection id and zip filename
    downloadSupportFile(): Promise<AxiosResponse<Blob>>,

    //to download support file for successful execution
    downloadSuccessSupportFile(): Promise<AxiosResponse<Blob>>,

    //to get list of support files by connection
    getSupportFilesByConnection(): Promise<AxiosResponse<SupportFileResponse>>,

    //to get list of support files for all connections
    getSupportFiles(): Promise<AxiosResponse<SupportFileResponse[]>>,

    //to delete support file
    deleteSupportFile(): Promise<AxiosResponse<IResponse>>,

    //to delete list of support files
    deleteSupportFiles(data: DeleteSupportFilesRequest): Promise<AxiosResponse<IResponse>>,
}
