import ModelBody from "@model/invoker/Body";

export enum REQUEST_METHOD{
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}
export default interface ModelRequest{
    body: ModelBody;
    endpoint: string;
    header: any;
    method: REQUEST_METHOD;
}