import {AxiosResponse} from "axios";
import { IInvoker } from "@interface/invoker/IInvoker";
import {IResponse} from "../application/IResponse";
import {IOperation} from "@interface/invoker/IOperation";

interface FieldProps{
    name: string,
    type: ResponseType,
    value: any,
}

export interface UpdateMethodProps{
    method: string,
    path: string,
    fields: FieldProps[]
}

export interface IInvokerRequest{

    //to import invoker as an xml file
    importInvoker(invoker: FormData): Promise<AxiosResponse<IInvoker>>,

    //to update a single operation
    updateOperation(data: UpdateMethodProps): Promise<AxiosResponse<IOperation>>,

    //to check if invoker with such title already exists
    checkInvokerTitle(): Promise<AxiosResponse<IResponse>>,

    //to get invoker by name
    getInvokerByName(): Promise<AxiosResponse<IInvoker>>,

    //to get all invokers of authorized user
    getAllInvokers(): Promise<AxiosResponse<IInvoker[]>>,

    //to add invoker
    addInvoker(invoker: IInvoker): Promise<AxiosResponse<IInvoker>>,

    /*
    * TODO: backend is not implemented
    */
    //to update invoker
    updateInvoker(invoker: IInvoker): Promise<AxiosResponse<IInvoker>>,

    //to delete invoker by name
    deleteInvokerByName(): Promise<AxiosResponse<IInvoker>>,

    //to delete invokers by id
    deleteInvokersById(invoker: number[]): Promise<AxiosResponse<number[]>>,

    //to upload image of invoker
    uploadInvokerImage(data: FormData): Promise<AxiosResponse<IInvoker>>,

    /*
    * TODO: do not exist such method on the server
    */
    //to delete image of invoker
    deleteInvokerImage(): Promise<AxiosResponse<any>>,
}