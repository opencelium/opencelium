import {
	DeleteLogsRequest,
	GetMethodTraceRequest,
	GetMethodTraceResponse,
	GetOperatorTraceRequest,
	GetOperatorTraceResponse,
} from './IConnectionLog';

export interface IConnectionLogRequest {
	getMethodTrace(
		request: GetMethodTraceRequest
	): Promise<GetMethodTraceResponse>;
	getOperatorTrace(
		request: GetOperatorTraceRequest
	): Promise<GetOperatorTraceResponse>;
	deleteLogs(request: DeleteLogsRequest): Promise<void>;
}
