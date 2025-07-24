import React, {useState} from 'react';
import {
	ConnectionSocketLog,
	DetailedIfOperatorSegment, DetailedOperatorSegment,
	IfOperatorProperty,
	LoopOperatorProperty,
	Trace,
} from '@root/requests/models/ConnectionLog';
import ToggleButton from '../ToggleButton/ToggleButton';
import TraceItem from '../TraceItem';
import styles from './OperatorTrace.module.css';
import {useAppDispatch} from "@application/utils/store";
import {cleanOperatorTrace} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import FontIcon from "@basic_components/FontIcon";
import {getDetailedOperator, getOperatorChildren} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel/LogsPanel";

interface Props {
	trace: ConnectionSocketLog<DetailedOperatorSegment> & {children?: Trace[]};
	flowId: string;
	executionId: string;
	iterationIndexes: number[];
}

const INDENT_SIZE = 40;

export const OperatorTrace: React.FC<Props> = ({
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
	const [iterationIndex, setIterationIndex] = useState(1);
	const size = (trace.properties as LoopOperatorProperty).size;
	const handleToggle = async () => {
		if (!expanded) {
			setLoading(true);
			await dispatch(
				getDetailedOperator({
					executionId,
					flowId,
					indexPath: trace.indexPath,
					loopIndex: isLoop ? [...iterationIndexes, iterationIndex] : undefined,
				})
			);
			setLoading(false);
			setExpanded(true);
		} else {
			dispatch(cleanOperatorTrace({ flowId, indexPath: trace.indexPath }));
			setExpanded(false);
		}
	};

	const handleNextIteration = async (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(cleanOperatorTrace({ flowId, indexPath: trace.indexPath }));
		if (isLoop) {
			const nextIndex = iterationIndex + 1;
			if (nextIndex <= size) {
				setIterationIndex(nextIndex);
				setNextLoading(true);
				await dispatch(
					getOperatorChildren({
						executionId,
						flowId,
						indexPath: trace.indexPath,
						loopIndex: [...iterationIndexes, nextIndex],
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
			if (prevIndex >= 1) {
				setIterationIndex(prevIndex);
				setPrevLoading(true);
				await dispatch(
					getOperatorChildren({
						executionId,
						flowId,
						indexPath: trace.indexPath,
						loopIndex: [...iterationIndexes, prevIndex],
					})
				);
				setPrevLoading(false);
			}
		}
	};
	console.log(size === undefined)
	return (
		<div>
			<div className={styles.trace} onClick={handleToggle}>
				<div className={styles.traceLeftSide}>
					<ToggleButton
						loading={loading || size === undefined}
						expanded={expanded}
						onClick={handleToggle}
					/>
					<span className={styles.type}>{isIf ? 'IF' : 'LOOP'}</span>
					{ShowIndexPath && <span style={{ marginLeft: 8 }}>{trace.indexPath}</span>}
					{isIf && <span>
						{(trace.properties as IfOperatorProperty).expression}
					</span>}
				</div>
				{isIf && (
					<span className={styles.ifTraceRightSide} onClick={(e: any) => {e.preventDefault(); e.stopPropagation();}}>
						{(trace.segment as DetailedIfOperatorSegment).result ? 'true' : 'false'}
					</span>
				)}
				{isLoop && (
					<div className={styles.loopTraceRightSide} onClick={(e: any) => {e.preventDefault(); e.stopPropagation();}}>
						<span>
							{iterationIndex} - {size}
						</span>
						<FontIcon
							isButton={true}
							iconStyles={{cursor: 'pointer'}}
							size={16}
							disabled={iterationIndex === 1 || size === undefined}
							isLoading={prevLoading}
							value={'arrow_left'}
							onClick={(e: any) => handlePrevIteration(e)}
						/>
						<FontIcon
							isButton={true}
							iconStyles={{cursor: 'pointer'}}
							size={16}
							disabled={iterationIndex === size || size === undefined}
							isLoading={nextLoading}
							value={'arrow_right'}
							onClick={(e: any) => handleNextIteration(e)}
						/>
					</div>
				)}
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
