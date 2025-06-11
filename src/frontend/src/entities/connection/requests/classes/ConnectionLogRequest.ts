import {
	GetMethodTraceResponse,
	GetOperatorTraceResponse, TestConnectionResponse,
} from '../interfaces/IConnectionLog';
import { IConnectionLogRequest } from '../interfaces/IConnectionLogRequest';
import Request from "@entity/application/requests/classes/Request";
import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";

export class ConnectionLogRequest extends Request implements IConnectionLogRequest {

	constructor(settings?: Partial<IRequestSettings>) {
		super({url: 'execution', ...settings});
	}
	async getMethodTrace(): Promise<AxiosResponse<GetMethodTraceResponse>> {
		return super.get<GetMethodTraceResponse>();
	}

	async getOperatorTrace(): Promise<AxiosResponse<GetOperatorTraceResponse>> {
		return super.get<GetOperatorTraceResponse>();
	}

	async deleteLogs(): Promise<AxiosResponse<IResponse>> {
		return super.delete<IResponse>();
	}

	async testConnection(connection: any): Promise<AxiosResponse<TestConnectionResponse>> {
		this.url = 'connection';
		return super.post<TestConnectionResponse>(connection);
	}
}
