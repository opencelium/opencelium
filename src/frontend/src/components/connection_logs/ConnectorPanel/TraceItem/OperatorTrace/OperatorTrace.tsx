import React, {useEffect, useState} from 'react';
import { OperatorTrace as OperatorTraceType } from '@root/requests/models/ConnectionLog';
import ToggleButton from '../ToggleButton/ToggleButton';
import TraceItem from '../TraceItem';
import styles from './OperatorTrace.module.css';
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {getOperatorTrace} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {cleanOperatorTrace} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import FontIcon from "@basic_components/FontIcon";

interface Props {
	trace: OperatorTraceType;
	connectorId: string;
	executionId: string;
	connectionId: string;
	iterationIndexes: number[];
}

const INDENT_SIZE = 40;

export const OperatorTrace: React.FC<Props> = ({
	trace,
	connectorId,
	executionId,
	connectionId,
	iterationIndexes,
}) => {
	const dispatch = useAppDispatch();
	const [expanded, setExpanded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [nextLoading, setNextLoading] = useState(false);
	const [prevLoading, setPrevLoading] = useState(false);
	const [iterationIndex, setIterationIndex] = useState(
		trace.info.type === 'loop' ? trace.info.iteration.current : 1
	);
	const handleToggle = async () => {
		if (!expanded) {
			setLoading(true);
			await dispatch(
				getOperatorTrace({
					executionId,
					connectorId,
					indexPath: trace.indexPath,
					iterationIndexes: trace.info.type === 'loop' ? [...iterationIndexes, iterationIndex] : undefined,
				})
			);
			setLoading(false);
			setExpanded(true);
		} else {
			dispatch(cleanOperatorTrace({ connectorId, indexPath: trace.indexPath }));
			setExpanded(false);
		}
	};

	const handleNextIteration = async (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(cleanOperatorTrace({ connectorId, indexPath: trace.indexPath }));
		if (trace.info.type === 'loop') {
			const nextIndex = iterationIndex + 1;
			if (nextIndex <= trace.info.iteration.total) {
				setIterationIndex(nextIndex);
				setNextLoading(true);
				await dispatch(
					getOperatorTrace({
						executionId,
						connectorId,
						indexPath: trace.indexPath,
						iterationIndexes: [...iterationIndexes, nextIndex],
					})
				);
				setNextLoading(false);
			}
		}
	};

	const handlePrevIteration = async (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(cleanOperatorTrace({ connectorId, indexPath: trace.indexPath }));
		if (trace.info.type === 'loop') {
			const prevIndex = iterationIndex - 1;
			if (prevIndex >= 1) {
				setIterationIndex(prevIndex);
				setPrevLoading(true);
				await dispatch(
					getOperatorTrace({
						executionId,
						connectorId,
						indexPath: trace.indexPath,
						iterationIndexes: [...iterationIndexes, prevIndex],
					})
				);
				setPrevLoading(false);
			}
		}
	};
	return (
		<div>
			<div className={styles.trace} onClick={handleToggle}>
				<div className={styles.traceLeftSide}>
					<ToggleButton
						loading={loading}
						expanded={expanded}
						onClick={handleToggle}
					/>
					<span className={styles.type}>{trace.info.type}</span>
					{ShowIndexPath && <span style={{ marginLeft: 8 }}>{trace.indexPath}</span>}
					{trace.info.type === 'if' && <span>
						{trace.conditionStatement}
					</span>}
				</div>
				{trace.info.type === 'if' && (
					<span className={styles.ifTraceRightSide} onClick={(e: any) => {e.preventDefault(); e.stopPropagation();}}>
						{trace.info.conditionResult ? 'true' : 'false'}
					</span>
				)}
				{trace.info.type === 'loop' && (
					<div className={styles.loopTraceRightSide} onClick={(e: any) => {e.preventDefault(); e.stopPropagation();}}>
						<span>
							Index {iterationIndex} - {trace.info.iteration.total}
						</span>
						<FontIcon
							isButton={true}
							iconStyles={{cursor: 'pointer'}}
							size={16}
							disabled={iterationIndex === 1}
							isLoading={prevLoading}
							value={'arrow_left'}
							onClick={(e: any) => handlePrevIteration(e)}
						/>
						<FontIcon
							isButton={true}
							iconStyles={{cursor: 'pointer'}}
							size={16}
							disabled={iterationIndex === trace.info.iteration.total}
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
					{trace.traces ? trace.traces.map((innerTrace) => (
						<TraceItem
							key={innerTrace.indexPath}
							trace={innerTrace}
							connectorId={connectorId}
							executionId={executionId}
							connectionId={connectionId}
							iterationIndexes={trace.info.type === 'loop' ? [...iterationIndexes, iterationIndex] : iterationIndexes}
						/>
					)) : `There are no traces for ${trace.indexPath}`}
				</div>
			)}
		</div>
	);
};
