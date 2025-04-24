import {
	HttpRequestLog,
	HttpResponseLog,
	MethodTrace,
	OperatorTrace,
} from '../models/ConnectionLog';

export interface GetTraceRequest {
	executionId: string;
	connectionId: string;
	connectorId: string;
	indexPath: string;
}

export interface GetMethodTraceRequest extends GetTraceRequest {}

export interface GetMethodTraceResponse {
	request: HttpRequestLog;
	response: HttpResponseLog;
}

export interface GetOperatorTraceRequest extends GetTraceRequest {
	iterationIndex?: number;
}

export interface GetOperatorTraceResponse {
	logs: (MethodTrace | OperatorTrace)[];
}

export interface DeleteLogsRequest {
	executionId: string;
	connectionId: string;
}
