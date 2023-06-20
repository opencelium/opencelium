/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import { IInvoker } from "../../interfaces/IInvoker";
import {IOperation} from "../../interfaces/IOperation";
import ModelInvokerHateoas from "../models/InvokerHateoas";
import ModelInvoker from "../models/Invoker";

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
    getAllInvokers(): Promise<AxiosResponse<ModelInvoker[] | null>>,

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
    deleteInvokersByName(invoker: string[]): Promise<AxiosResponse<IResponse>>,

    //to upload image of invoker
    uploadInvokerImage(data: FormData): Promise<AxiosResponse<IInvoker>>,

    /*
    * TODO: do not exist such method on the server
    */
    //to delete image of invoker
    deleteInvokerImage(): Promise<AxiosResponse<any>>,
}