import React, { useState } from 'react';
import { useAppDispatch } from '../../../../../storeHooks';
import { getOperatorTrace } from '../../../../connection/redux_toolkit/action_creators/ConnectionLogCreators';
import { cleanOperatorTrace } from '../../../../connection/redux_toolkit/slices/ConnectionLogSlice';
import { OperatorTrace as OperatorTraceType } from '../../../../connection/requests/models/ConnectionLog';
import ToggleButton from '../ToggleButton/ToggleButton';
import TraceItem from '../TraceItem';
import styles from './OperatorTrace.module.css';

interface Props {
	trace: OperatorTraceType;
	connectorId: string;
	executionId: string;
	connectionId: string;
}

const INDENT_SIZE = 40;

export const OperatorTrace: React.FC<Props> = ({
	trace,
	connectorId,
	executionId,
	connectionId,
}) => {
	const dispatch = useAppDispatch();
	const [expanded, setExpanded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [iterationIndex, setIterationIndex] = useState(
		trace.info.type === 'loop' ? trace.info.iteration.current : 1
	);

	const handleToggle = async () => {
		if (!expanded) {
			setLoading(true);
			await dispatch(
				getOperatorTrace({
					executionId,
					connectionId,
					connectorId,
					indexPath: trace.indexPath,
					iterationIndex:
						trace.info.type === 'loop' ? iterationIndex : undefined,
				})
			);
			setLoading(false);
			setExpanded(true);
		} else {
			dispatch(cleanOperatorTrace({ connectorId, indexPath: trace.indexPath }));
			setExpanded(false);
		}
	};

	const handleNextIteration = async () => {
		if (trace.info.type === 'loop') {
			const nextIndex = iterationIndex + 1;
			if (nextIndex <= trace.info.iteration.total) {
				setIterationIndex(nextIndex);
				setLoading(true);
				await dispatch(
					getOperatorTrace({
						executionId,
						connectionId,
						connectorId,
						indexPath: trace.indexPath,
						iterationIndex: nextIndex,
					})
				);
				setLoading(false);
			}
		}
	};

	const handlePrevIteration = async () => {
		if (trace.info.type === 'loop') {
			const prevIndex = iterationIndex - 1;
			if (prevIndex >= 1) {
				setIterationIndex(prevIndex);
				setLoading(true);
				await dispatch(
					getOperatorTrace({
						executionId,
						connectionId,
						connectorId,
						indexPath: trace.indexPath,
						iterationIndex: prevIndex,
					})
				);
				setLoading(false);
			}
		}
	};

	return (
		<div>
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<ToggleButton
					loading={loading}
					expanded={expanded}
					onClick={handleToggle}
				/>
				<span className={styles.operatorType}>{trace.info.type}</span>
				<span style={{ marginLeft: 8 }}>{trace.indexPath}</span>
				{trace.info.type === 'if' && (
					<span style={{ marginLeft: 8 }}>
						Condition: {trace.conditionStatement}, Result:{' '}
						{trace.info.conditionResult ? 'true' : 'false'}
					</span>
				)}
				{trace.info.type === 'loop' && (
					<div style={{ marginLeft: 8 }}>
						<span>
							Iteration: {iterationIndex} / {trace.info.iteration.total}
						</span>

						<button onClick={handlePrevIteration} style={{ marginLeft: 8 }}>
							Prev
						</button>
						<button onClick={handleNextIteration} style={{ marginLeft: 4 }}>
							Next
						</button>
					</div>
				)}
			</div>

			{expanded && (
				<div
					style={{
						marginLeft: INDENT_SIZE,
						marginTop: 4,
						borderLeft: '1px dashed #aaa',
						paddingLeft: 8,
					}}
				>
					{trace.traces.map((innerTrace) => (
						<TraceItem
							key={innerTrace.indexPath}
							trace={innerTrace}
							connectorId={connectorId}
							executionId={executionId}
							connectionId={connectionId}
						/>
					))}
				</div>
			)}
		</div>
	);
};
