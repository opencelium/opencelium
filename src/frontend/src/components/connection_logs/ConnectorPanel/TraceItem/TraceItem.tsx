import { Trace } from "@root/requests/models/ConnectionLog";
import { ITheme } from '@style/Theme';
import React from 'react';
import MethodTrace from './MethodTrace/MethodTrace';
import { OperatorTrace } from './OperatorTrace/OperatorTrace';

interface TraceItemProps {
	trace: Trace;
	connectorId: string;
	executionId: string;
	connectionId: string;
	iterationIndexes: number[];
	theme?: ITheme;
}

export const TraceItem: React.FC<TraceItemProps> = ({
	trace,
	connectorId,
	executionId,
	connectionId,
	iterationIndexes,
	theme
}) => {
	if (trace.logType === 'method') {
		return (
			<MethodTrace
				trace={trace}
				connectorId={connectorId}
				executionId={executionId}
				connectionId={connectionId}
				theme={theme}
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
