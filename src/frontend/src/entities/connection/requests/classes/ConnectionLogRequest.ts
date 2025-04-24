import {
	DeleteLogsRequest,
	GetMethodTraceRequest,
	GetMethodTraceResponse,
	GetOperatorTraceRequest,
	GetOperatorTraceResponse,
} from '../interfaces/IConnectionLog';
import { IConnectionLogRequest } from '../interfaces/IConnectionLogRequest';
import { OperatorTrace, Trace } from '../models/ConnectionLog';

export class ConnectionLogRequest implements IConnectionLogRequest {
	async getMethodTrace(
		request: GetMethodTraceRequest
	): Promise<GetMethodTraceResponse> {
		const response: GetMethodTraceResponse = {
			request: {
				headers: { 'Content-Type': 'application/json' },
				body: { example: 'method request body' },
			},
			response: {
				headers: { 'Content-Type': 'application/json' },
				body: { example: 'method response body' },
			},
		};
		return Promise.resolve(response);
	}

	async getOperatorTrace(
		request: GetOperatorTraceRequest
	): Promise<GetOperatorTraceResponse> {
		const logs: OperatorTrace[] = [
			{
				logType: 'operator',
				indexPath: request.indexPath,
				conditionStatement: 'x > 0',
				info: {
					type: 'if',
					conditionResult: true,
				},
				traces: [] as Trace[],
			},
		];
		return Promise.resolve({ logs });
	}

	async deleteLogs(request: DeleteLogsRequest): Promise<void> {
		return Promise.resolve();
	}
}
