import {
	GetMethodTraceResponse,
	GetOperatorTraceResponse, TestConnectionResponse,
} from './IConnectionLog';
import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";

export interface IConnectionLogRequest {
	getMethodTrace(): Promise<AxiosResponse<GetMethodTraceResponse>>;
	getOperatorTrace(): Promise<AxiosResponse<GetOperatorTraceResponse>>;
	deleteLogs(): Promise<AxiosResponse<IResponse>>;
	testConnection(connection: any): Promise<AxiosResponse<TestConnectionResponse>>;
}
