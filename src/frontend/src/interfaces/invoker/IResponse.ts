import {IForm} from "@interface/application/core";
import {IResponseResult} from "@interface/invoker/IResponseResult";

export interface IResponseText{
}

export interface IResponse extends IResponseText, IForm<IResponseText>{
    nodeId?: any;
    success: IResponseResult;
    fail: IResponseResult;
    getObject: () => any,
}