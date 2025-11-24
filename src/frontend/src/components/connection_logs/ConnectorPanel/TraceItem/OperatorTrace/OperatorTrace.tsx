import React, {useEffect, useState} from 'react';
import {
	ConnectionSocketLog, DetailedOperatorSegment,MetaTrace,
} from '@root/requests/models/ConnectionLog';
import TraceItem from '../TraceItem';
import styles from './OperatorTrace.module.css';
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {
	cleanOperatorTrace,
	setTraceConfig
} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {getOperatorChildren} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import OperatorTraceExpander
	from "@app_component/connection_logs/ConnectorPanel/TraceItem/OperatorTrace/OperatorTraceExpander";
import ErrorMessage from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/ErrorMessage";

export interface OperatorTraceProps {
	trace: ConnectionSocketLog<DetailedOperatorSegment> & MetaTrace;
	flowId: string;
	executionId: string;
	iterationIndexes: number[];
}

const INDENT_SIZE = 40;

export const OperatorTrace: React.FC<OperatorTraceProps> = ({
	trace,
	flowId,
	executionId,
	iterationIndexes,
}) => {
	const isLoop = trace.type === 'LOOP';
	const dispatch = useAppDispatch();
	const {traceConfigs} = useAppSelector((state: RootState) => state.connectionLogReducer);
	const [expanded, setExpanded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [iterationIndex, setIterationIndex] = useState(0);
	const handleToggle = async () => {
		if (!expanded) {
			setLoading(true);
			await dispatch(
				getOperatorChildren({
					executionId,
					flowId,
					indexPath: trace.indexPath,
					loopIndex: [...iterationIndexes, iterationIndex],
					id: trace.id,
				})
			);
			setLoading(false);
			setExpanded(true);
			dispatch(setTraceConfig({
				indexPath: trace.indexPath,
				config: {
					isOpened: true,
				}
			}));
		} else {
			dispatch(cleanOperatorTrace({flowId, indexPath: trace.indexPath}));
			setExpanded(false);
			dispatch(setTraceConfig({
				indexPath: trace.indexPath,
				config: {
					isOpened: false,
				}
			}));
		}
	}

	useEffect(() => {
		if (traceConfigs[trace.indexPath]) {
			if (traceConfigs[trace.indexPath].isOpened) {
				handleToggle();
			}
		}
	}, []);

	const hasError = !!trace?.error?.message;
	return (
		<div>
			<OperatorTraceExpander
				expanded={expanded}
				trace={trace}
				flowId={flowId}
				executionId={executionId}
				iterationIndexes={iterationIndexes}
				loading={loading}
				handleToggle={handleToggle}
				iterationIndex={iterationIndex}
				setIterationIndex={setIterationIndex}
			/>
			{
				expanded && (
					<div
						className={styles.expandedContainer}
						style={{
							marginLeft: INDENT_SIZE,
						}}
					>
						{hasError ?
							<ErrorMessage trace={trace}/>
							:
							trace.children ? trace.children.map((innerTrace) => (
								<TraceItem
									key={innerTrace.indexPath}
									trace={innerTrace}
									flowId={flowId}
									executionId={executionId}
									iterationIndexes={isLoop ? [...iterationIndexes, iterationIndex] : iterationIndexes}
								/>
							)) : `There are no traces for ${trace.indexPath}`
						}
					</div>
				)
			}
		</div>
	);
};
