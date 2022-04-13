
export enum DataType{
    Raw= 'raw',
    GraphQL= 'graphql',
}

export enum ResponseFormat{
    Json= 'json',
    Xml= 'xml',
}

export enum ResponseType{
    Object= 'object',
    Array= 'array',
    String= 'string',
}

export default interface ModelBody {
    data: DataType;
    fields: any;
    format: DataType;
    type: ResponseType;
}