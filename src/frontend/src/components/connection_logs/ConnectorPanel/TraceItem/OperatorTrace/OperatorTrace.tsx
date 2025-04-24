import React, { useState } from 'react';
import { OperatorTrace as OperatorTraceType } from '@root/requests/models/ConnectionLog';
import ToggleButton from '../ToggleButton/ToggleButton';
import TraceItem from '../TraceItem';
import styles from './OperatorTrace.module.css';
import {useAppDispatch} from "@application/utils/store";
import {getOperatorTrace} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {cleanOperatorTrace} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

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
		<div style={{cursor: 'pointer'}} onClick={handleToggle}>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<div style={{display: 'flex'}}>
					<ToggleButton
						loading={loading}
						expanded={expanded}
						onClick={handleToggle}
					/>
					<span className={styles.operatorType}>{trace.info.type}</span>
					{ShowIndexPath && <span style={{ marginLeft: 8 }}>{trace.indexPath}</span>}
					{trace.info.type === 'if' && <span>
						{trace.conditionStatement}
					</span>}
				</div>
				{trace.info.type === 'if' && (
					<span style={{ marginLeft: 8 }}>
						{trace.info.conditionResult ? 'true' : 'false'}
					</span>
				)}
				{trace.info.type === 'loop' && (
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<span>
							Index {iterationIndex} - {trace.info.iteration.total}
						</span>
						<TooltipFontIcon
							size={16}
							tooltip={'Previous'}
							value={'arrow_left'}
							onClick={() => {}}
						/>
						<TooltipFontIcon
							size={16}
							tooltip={'Next'}
							value={'arrow_right'}
							onClick={() => {}}
						/>
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
