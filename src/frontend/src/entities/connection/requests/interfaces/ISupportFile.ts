import {AxiosResponse} from "axios";

export interface SupportFileResponse {
    connectionId: number,
    supportFiles: string[],
}

export type SupportFileResponseProps = keyof SupportFileResponse | string;

export default interface ISupportFileRequest {
    //to download support file by connection id and zip filename
    downloadSupportFile(): Promise<AxiosResponse<Blob>>,

    //to download support file for successful execution
    downloadSuccessSupportFile(): Promise<AxiosResponse<Blob>>,

    //to get list of support files by connection
    getSupportFilesByConnection(): Promise<AxiosResponse<SupportFileResponse>>,

    //to get list of support files for all connections
    getSupportFiles(): Promise<AxiosResponse<SupportFileResponse[]>>,
}
