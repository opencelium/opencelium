import {IForm} from "@interface/application/core";
import {InvokerState} from "@slice/InvokerSlice";
import {Operation} from "@class/invoker/Operation";


export enum AuthType{
    ApiKey= 'apikey',
    Basic= 'basic',
    EndpointAuth= 'endpointAuth',
    Token= 'token',
}

export interface IInvokerRadios{
    authType: AuthType,
}

export interface IInvokerFile{
    iconFile: FileList;
}

export interface IInvokerTextarea{
    description: string;
}

export interface IInvokerText{
    name: string;
    hint: string;
}


export interface IInvokerForm extends IInvokerText, IInvokerTextarea, IInvokerFile, IInvokerRadios, IForm<IInvokerText, {}, IInvokerRadios, IInvokerFile, IInvokerTextarea, {}>{
    getByName: () => boolean;
    add: (connection: Operation, operations: Operation[]) => boolean;
    update: (connection: Operation, operations: Operation[]) => boolean;
    deleteByName: () => boolean;
    uploadImage: () => boolean;
    deleteImage: () => boolean;
    checkName: () => boolean;
    reduxState?: InvokerState;
}

export interface IInvoker extends IInvokerForm{
    id?: number;
    invokerId?: number;
    icon?: string;
    operations: Operation[];
    requiredData: string[];
    shouldDeletePicture?: boolean,
    getObject: () => any,
    getXml: () => string,
    getConnection: () => Operation,
}
