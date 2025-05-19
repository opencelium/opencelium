interface BaseSocketLog {
	executionId: string;
	connectionId: string;
	connectorId: string;
	connectorName: string;
}
export type ConnectionSocketLog =
| (MethodTrace & BaseSocketLog)
| (OperatorTrace & BaseSocketLog);

export interface ConnectionLog {
	executionId: string;
	connectionId: string;
	connectors: ConnectorLog[];
}

export interface ConnectorLog {
	id: string;
	name: string;
	traces: Trace[];
}

export type Trace = MethodTrace | OperatorTrace;

export interface MethodTrace {
	logType: 'method';
	indexPath: string;
	httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	statusCode: number;
	url: string;
	executionTime: number;
	requestDetails?: HttpRequestLog;
	responseDetails?: HttpResponseLog;
}

export interface HttpRequestLog {
	headers: Record<string, string>;
	body?: any;
}

export interface HttpResponseLog {
	headers: Record<string, string>;
	body?: any;
}

export interface OperatorTrace {
	logType: 'operator';
	indexPath: string;
	conditionStatement: string;
	info: OperatorInfo;
	traces: Trace[];
}

export type OperatorInfo = OperatorLoopInfo | OperatorIfInfo;

export interface OperatorLoopInfo {
	type: 'loop';
	iteration: {
		current: number;
		total: number;
	};
}

export interface OperatorIfInfo {
	type: 'if';
	conditionResult: boolean;
}
