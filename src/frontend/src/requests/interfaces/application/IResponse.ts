export enum ResponseMessages{
    'EXISTS'= 'EXISTS',
    'NOT_EXISTS'= 'NOT_EXISTS',
    'UNSUPPORTED_HEADER_AUTH_TYPE'= 'UNSUPPORTED_HEADER_AUTH_TYPE',
    'CONNECTOR_COMMUNICATION_FAILED'= 'COMMUNICATION_FAILED',
    'CONNECTOR_EXISTS'= 'CONNECTOR_ALREADY_EXISTS',
    'NETWORK_ERROR'= 'NETWORK_ERROR',
}

export interface IResponse{
    error: string,
    message: string,
    path: string,
    status: number,
    timestamp: string,
}

export interface SettingsProps{
    withoutNotification?: boolean,
}

export interface IApplicationResponse<T>{
    data: T,
    settings: SettingsProps,
}