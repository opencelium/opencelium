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
	requestDetails: HttpRequestLog;
	responseDetails: HttpResponseLog;
}

export interface GetOperatorTraceRequest extends Omit<GetTraceRequest, "connectionId"> {
	iterationIndexes?: number[];
}

export interface GetOperatorTraceResponse {
	traces: (MethodTrace | OperatorTrace)[];
}

export interface TestConnectionResponse {
	schedulerId: number,
}

export interface DeleteLogsRequest {
	executionId: string;
	connectionId: string;
}
