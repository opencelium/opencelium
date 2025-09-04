import React, {useState} from 'react';
import {
	ConnectionSocketLog,
	DetailedIfOperatorSegment, DetailedOperatorSegment,
	LoopOperatorProperty, MetaTrace,
} from '@root/requests/models/ConnectionLog';
import ToggleButton from '../ToggleButton/ToggleButton';
import TraceItem from '../TraceItem';
import styles from './OperatorTrace.module.css';
import {useAppDispatch} from "@application/utils/store";
import {cleanOperatorTrace, copyLogContentToClipboard} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import FontIcon from "@basic_components/FontIcon";
import {getOperatorChildren} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel/LogsPanel";
import {TextSize} from "@app_component/base/text/interfaces";
import Button from "@app_component/base/button/Button";
import {copyStringToClipboard} from "@application/utils/utils";
import {ConnectionLogRequest} from "@root/requests/classes/ConnectionLogRequest";
import CopyOperatorButton from "@app_component/connection_logs/ConnectorPanel/CopyOperatorButton";

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
	const isIf = trace.type === 'IF';
	const dispatch = useAppDispatch();
	const [expanded, setExpanded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [nextLoading, setNextLoading] = useState(false);
	const [prevLoading, setPrevLoading] = useState(false);
	const [iterationIndex, setIterationIndex] = useState(0);
	const loopOperatorProperty = trace.properties as LoopOperatorProperty;
	const size = loopOperatorProperty.size;
	const iterator = loopOperatorProperty.iterator;
	const handleToggle = async () => {
		if (!(loading || !trace.isCompleted)) {
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
			} else {
				dispatch(cleanOperatorTrace({flowId, indexPath: trace.indexPath}));
				setExpanded(false);
			}
		}
	}

	const handleNextIteration = async (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(cleanOperatorTrace({ flowId, indexPath: trace.indexPath }));
		if (isLoop) {
			const nextIndex = iterationIndex + 1;
			if (nextIndex <= size - 1) {
				setIterationIndex(nextIndex);
				setNextLoading(true);
				await dispatch(
					getOperatorChildren({
						executionId,
						flowId,
						indexPath: trace.indexPath,
						loopIndex: [...iterationIndexes, nextIndex],
						id: trace.id,
					})
				);
				setNextLoading(false);
			}
		}
	};

	const handlePrevIteration = async (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(cleanOperatorTrace({ flowId, indexPath: trace.indexPath }));
		if (isLoop) {
			const prevIndex = iterationIndex - 1;
			if (prevIndex >= 0) {
				setIterationIndex(prevIndex);
				setPrevLoading(true);
				await dispatch(
					getOperatorChildren({
						executionId,
						flowId,
						indexPath: trace.indexPath,
						loopIndex: [...iterationIndexes, prevIndex],
						id: trace.id,
					})
				);
				setPrevLoading(false);
			}
		}
	};
	const hasError = trace?.error?.message;
	return (
		<div>
			<div className={styles.trace} style={{cursor: loading || !trace.isCompleted ? 'default' : 'pointer'}} onClick={handleToggle}>
				<div className={styles.traceLeftSide}>
					<ToggleButton
						loading={loading || !trace.isCompleted}
						expanded={expanded}
						onClick={handleToggle}
					/>
					<span className={styles.type}>{isIf ? 'IF' : 'LOOP'}</span>
					{isLoop && <span className={styles.iterator}>({iterator})</span>}
					{isIf && <CopyOperatorButton trace={trace} flowId={flowId} executionId={executionId} iterationIndexes={iterationIndexes} iterationIndex={iterationIndex}/>}
					{ShowIndexPath && <span style={{ marginLeft: 8 }}>{trace.indexPath}</span>}
				</div>
				<React.Fragment>
					{isIf && (
						<span className={styles.ifTraceRightSide} onClick={(e: any) => {e.preventDefault(); e.stopPropagation();}}>
							{(trace.segment as DetailedIfOperatorSegment).result ? 'true' : 'false'}
						</span>
					)}
					{isLoop && (
						<div className={styles.loopTraceRightSide} onClick={(e: any) => {e.preventDefault(); e.stopPropagation();}}>
							<span>
								{(iterationIndex + 1)} - {size || '...'}
							</span>
							<FontIcon
								isButton={true}
								iconStyles={{cursor: 'pointer'}}
								size={16}
								disabled={iterationIndex === 0 || size === undefined}
								isLoading={prevLoading}
								value={'arrow_left'}
								onClick={(e: any) => handlePrevIteration(e)}
							/>
							<FontIcon
								isButton={true}
								iconStyles={{cursor: 'pointer'}}
								size={16}
								disabled={iterationIndex === size - 1 || size === undefined}
								isLoading={nextLoading}
								value={'arrow_right'}
								onClick={(e: any) => handleNextIteration(e)}
							/>
						</div>
					)}
				</React.Fragment>
			</div>

			{expanded && (
				<div
					className={styles.expandedContainer}
					style={{
						marginLeft: INDENT_SIZE,
					}}
				>
					{trace.children ? trace.children.map((innerTrace) => (
						<TraceItem
							key={innerTrace.indexPath}
							trace={innerTrace}
							flowId={flowId}
							executionId={executionId}
							iterationIndexes={isLoop ? [...iterationIndexes, iterationIndex] : iterationIndexes}
						/>
					)) : `There are no traces for ${trace.indexPath}`}
				</div>
			)}
		</div>
	);
};
