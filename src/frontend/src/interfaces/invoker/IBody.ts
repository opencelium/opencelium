import {IForm} from "@interface/application/core";
import {ReactElement} from "react";
import {InputElementProps} from "@atom/input/interfaces";

export enum DataType{
    Raw= 'raw',
    GraphQL= 'graphql',
};

export enum ResponseFormat{
    Json= 'json',
    Xml= 'xml',
}

export enum ResponseType{
    Object= 'object',
    Array= 'array',
    String= 'string',
}

export interface IBodyRadios{
    format: ResponseFormat,
}

export interface IBodyText{
}

export interface IBody extends IBodyText, IBodyRadios, IForm<IBodyText, {}, IBodyRadios>{
    nodeId?: any;
    type: ResponseType,
    fields: any;
    data: DataType;
    getFields: (props?: InputElementProps) => ReactElement;
    getObject: () => any,
    setType: (type: ResponseType) => void,
}