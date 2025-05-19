import React from 'react';
import MethodTrace from './MethodTrace/MethodTrace';
import { OperatorTrace } from './OperatorTrace/OperatorTrace';
import {Trace} from "@root/requests/models/ConnectionLog";

interface TraceItemProps {
	trace: Trace;
	connectorId: string;
	executionId: string;
	connectionId: string;
	iterationIndexes: number[];
}

export const TraceItem: React.FC<TraceItemProps> = ({
	trace,
	connectorId,
	executionId,
	connectionId,
	iterationIndexes,
}) => {
	if (trace.logType === 'method') {
		return (
			<MethodTrace
				trace={trace}
				connectorId={connectorId}
				executionId={executionId}
				connectionId={connectionId}
			/>
		);
	}

	if (trace.logType === 'operator') {
		return (
			<OperatorTrace
				trace={trace}
				connectorId={connectorId}
				executionId={executionId}
				connectionId={connectionId}
				iterationIndexes={iterationIndexes}
			/>
		);
	}

	return null;
};

export default TraceItem;
