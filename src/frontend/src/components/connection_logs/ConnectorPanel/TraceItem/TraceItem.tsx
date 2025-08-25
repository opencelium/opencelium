import {
	ConnectionSocketLog,
	DetailedMethodSegment,
	DetailedOperatorSegment,
	Trace
} from "@root/requests/models/ConnectionLog";
import { ITheme } from '@style/Theme';
import React from 'react';
import MethodTrace from './MethodTrace/MethodTrace';
import { OperatorTrace } from './OperatorTrace/OperatorTrace';

interface TraceItemProps {
	trace: Trace;
	flowId: string;
	executionId: string;
	iterationIndexes: number[];
	theme?: ITheme;
}

export const TraceItem: React.FC<TraceItemProps> = ({
	trace,
	flowId,
	executionId,
	iterationIndexes,
	theme
}) => {
	if (trace.type === 'OPERATION') {
		return (
			<MethodTrace
				trace={trace as ConnectionSocketLog<DetailedMethodSegment>}
				flowId={flowId}
				executionId={executionId}
				theme={theme}
			/>
		);
	}

	if (trace.type === 'IF' || trace.type === 'LOOP') {
		return (
			<OperatorTrace
				trace={trace as ConnectionSocketLog<DetailedOperatorSegment>}
				flowId={flowId}
				executionId={executionId}
				iterationIndexes={iterationIndexes}
			/>
		);
	}

	return null;
};

export default TraceItem;
