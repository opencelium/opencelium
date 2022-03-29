import {Request} from "../application/Request";
import {AxiosResponse} from "axios";
import {IInvoker} from "@interface/invoker/IInvoker";
import {IInvokerRequest, UpdateMethodProps} from "../../interfaces/invoker/IInvoker";
import {IRequestSettings} from "../../interfaces/application/IRequest";
import {IResponse} from "../../interfaces/application/IResponse";
import {IOperation} from "@interface/invoker/IOperation";


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

    async getAllInvokers(): Promise<AxiosResponse<IInvoker[]>>{
        return super.get<IInvoker[]>();
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

    async deleteInvokersById(invokerIds: number[]): Promise<AxiosResponse<number[]>>{
        return super.delete<number[]>({data: invokerIds});
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