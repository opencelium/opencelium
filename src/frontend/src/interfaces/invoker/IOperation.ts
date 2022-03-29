import {IForm} from "@interface/application/core";
import {IRequest} from "@interface/invoker/IRequest";
import {IResponse} from "@interface/invoker/IResponse";

export type OperationType = 'test' | '';

export interface IOperationText{
    name: string;
}

export interface IOperation extends IOperationText, IForm<IOperationText>{
    type: OperationType;
    request: IRequest;
    response: IResponse;
    uniqueIndex: string;
    getObject: () => any,
}