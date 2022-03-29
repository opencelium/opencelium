import {IForm} from "@interface/application/core";
import {REQUEST_METHOD} from "@requestInterface/application/IRequest";
import {IBody} from "@interface/invoker/IBody";

export interface IRequestText{
    endpoint: string;
}

export interface IRequestRadios{
    method: REQUEST_METHOD,
}

export interface IRequest extends IRequestText, IRequestRadios, IForm<IRequestText, {}, IRequestRadios>{
    nodeId?: any;
    header?: any;
    body: IBody;
    getObject: () => any,
}