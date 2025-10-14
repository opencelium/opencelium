import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {
	ConnectionLogIdentifier,
	ConnectionSocketLog, DetailedMethodSegment,
	DetailedOperatorSegment,
	Trace
} from "@root/requests/models/ConnectionLog";

export interface ConLogRequestProps extends ConnectionLogIdentifier{
	loopIndex?: number[],
	id: string,
}
export interface TestConnectionResponse {
	schedulerId: number,
}
export interface DeleteLogsRequest {
	executionId: string,
}
export interface GetLogListResponse {
	result: string[],
}

export interface GetLogListProps{
	connectionId: string,
	schedulerId: string,
	status: 's' | 'f',
}

export interface IConnectionLogRequest {
	getDetailedMethod(data: ConLogRequestProps): Promise<AxiosResponse<ConnectionSocketLog<DetailedMethodSegment>>>;
	getDetailedOperator(data: ConLogRequestProps): Promise<AxiosResponse<ConnectionSocketLog<DetailedOperatorSegment>>>;
	getOperatorChildren(data: ConLogRequestProps): Promise<AxiosResponse<Trace[]>>;
	deleteLogs(data: DeleteLogsRequest): Promise<AxiosResponse<IResponse>>;
	testConnection(connection: any): Promise<AxiosResponse<TestConnectionResponse>>;
	getLogList(data: GetLogListProps): Promise<AxiosResponse<GetLogListResponse>>;
}
