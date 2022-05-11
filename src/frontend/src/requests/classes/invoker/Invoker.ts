/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IInvoker} from "@interface/invoker/IInvoker";
import {IInvokerRequest, UpdateMethodProps} from "../../interfaces/invoker/IInvoker";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";
import {IOperation} from "@interface/invoker/IOperation";
import ModelInvokerHateoas from "@model/invoker/InvokerHateoas";


export class InvokerRequest extends Request implements IInvokerRequest{

    constructor(settings?: Partial<IRequestSettings>) {
        super({url: 'invoker', ...settings});
    }

    async importInvoker(invoker: FormData): Promise<AxiosResponse<IInvoker>>{
        this.url = 'storage/invoker';
        return super.post<IInvoker>(invoker);
    }

    async updateOperation(data: UpdateMethodProps): Promise<AxiosResponse<IOperation>>{
        return super.post<IOperation>(data);
    }

    async checkInvokerTitle(): Promise<AxiosResponse<IResponse>>{
        return super.get<IResponse>();
    }

    async getInvokerByName(): Promise<AxiosResponse<IInvoker>>{
        return super.get<IInvoker>();
    }

    async getAllInvokers(): Promise<AxiosResponse<ModelInvokerHateoas | null>>{
        return super.get<ModelInvokerHateoas | null>();
    }

    async addInvoker(invoker: IInvoker): Promise<AxiosResponse<IInvoker>>{
        return super.post<IInvoker>(invoker);
    }

    async updateInvoker(invoker: IInvoker): Promise<AxiosResponse<IInvoker>>{
        return super.put<IInvoker>(invoker);
    }

    async deleteInvokerByName(): Promise<AxiosResponse<IInvoker>>{
        return super.delete<IInvoker>();
    }

    async deleteInvokersByName(invokerNames: string[]): Promise<AxiosResponse<IResponse>>{
        return super.delete<IResponse>({data: invokerNames});
    }

    async uploadInvokerImage(data: FormData): Promise<AxiosResponse<IInvoker>>{
        this.url = 'storage/invoker';
        return super.post<IInvoker>(data);
    }

    async deleteInvokerImage(): Promise<AxiosResponse<IInvoker>>{
        return super.delete<IInvoker>();
    }

    backendMap(invoker: IInvoker){
        let mappedInvoker = {
            title: invoker.name,
            description: invoker.description,
        };
        if(invoker.id !== 0){
            return {
                invokerId: invoker.id,
                ...mappedInvoker,
            }
        }
        return mappedInvoker;
    }
}