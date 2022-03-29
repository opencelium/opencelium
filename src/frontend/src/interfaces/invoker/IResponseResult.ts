import {IForm} from "@interface/application/core";
import {IBody} from "@interface/invoker/IBody";

export interface IResponseResultText{
    status: string;
}

export interface IResponseResult extends IResponseResultText, IForm<IResponseResultText>{
    nodeId?: any;
    header: any;
    body: IBody;
    getObject: () => any,
}