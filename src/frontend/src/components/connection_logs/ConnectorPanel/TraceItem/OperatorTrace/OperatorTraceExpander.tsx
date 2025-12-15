import React, {useState} from 'react';
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/OperatorTrace/OperatorTrace.module.css";
import ToggleButton from "@app_component/connection_logs/ConnectorPanel/TraceItem/ToggleButton/ToggleButton";
import {ColorTheme, ITheme} from "@style/Theme";
import CopyOperatorButton
    from "@app_component/connection_logs/ConnectorPanel/TraceItem/OperatorTrace/CopyOperatorButton";
import {ShowIndexPath} from "@app_component/connection_logs/LogsPanel/LogsPanel";
import {
    ConnectionSocketLog,
    DetailedIfOperatorSegment, DetailedOperatorSegment,
    LoopOperatorProperty, MetaTrace
} from "@root/requests/models/ConnectionLog";
import LoopIterator from "@app_component/connection_logs/ConnectorPanel/TraceItem/OperatorTrace/LoopIndex";
import FontIcon from "@basic_components/FontIcon";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {OperatorTraceProps} from "@app_component/connection_logs/ConnectorPanel/TraceItem/OperatorTrace/OperatorTrace";
import {cleanOperatorTrace} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {getOperatorChildren} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import {withTheme} from "styled-components";

interface OperatorTraceExpanderProps extends OperatorTraceProps{
    handleToggle: () => void,
    loading: boolean,
    expanded: boolean,
    iterationIndex: number,
    setIterationIndex: (newIndex: number) => void,
    theme?: ITheme,
}

const OperatorTraceExpander = ({theme, trace, loading, handleToggle, expanded, flowId, executionId, iterationIndexes, setIterationIndex, iterationIndex}: OperatorTraceExpanderProps) => {
    const dispatch = useAppDispatch();
    const {currentLogError} = useAppSelector((state: RootState) => state.connectionLogReducer);
    const [isMouseOver, setIsMouseOver] = useState<boolean>(false);
    const [nextLoading, setNextLoading] = useState(false);
    const [prevLoading, setPrevLoading] = useState(false);
    const isIf = trace.type === 'IF';
    const isLoop = trace.type === 'LOOP';
    const hasError = !!trace.error || trace.hasError || currentLogError.parentsPath.indexOf(trace.id) !== -1 || currentLogError.log?.id === trace.id;
    const isDisabledToggle = loading || !trace.isCompleted || isLoop && (trace.properties as LoopOperatorProperty).size === 0 || isIf && (trace.segment as DetailedIfOperatorSegment).result !== 'true' && !hasError;
    const loopOperatorProperty = trace.properties as LoopOperatorProperty;
    const size = loopOperatorProperty.size;
    const iterator = loopOperatorProperty.iterator;
    const handleNextIteration = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoop) {
            const nextIndex = iterationIndex + 1;
            if (nextIndex <= size - 1) {
                dispatch(cleanOperatorTrace({ flowId, indexPath: trace.indexPath }));
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

    const loadByIndex = async (newIndex: number) => {
        if (isLoop) {
            if (newIndex !== iterationIndex && newIndex >= 0 && newIndex <= size - 1) {
                dispatch(cleanOperatorTrace({ flowId, indexPath: trace.indexPath }));
                setIterationIndex(newIndex);
                setNextLoading(true);
                setPrevLoading(true);
                await dispatch(
                    getOperatorChildren({
                        executionId,
                        flowId,
                        indexPath: trace.indexPath,
                        loopIndex: [...iterationIndexes, newIndex],
                        id: trace.id,
                    })
                );
                setNextLoading(false);
                setPrevLoading(false);
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
    return (
        <div onMouseOver={() => setIsMouseOver(true)} onMouseLeave={() => setIsMouseOver(false)} className={styles.trace} style={{cursor: isDisabledToggle ? 'default' : 'pointer'}}
             onClick={isDisabledToggle ? () => {
             } : handleToggle}>
            <div className={styles.traceLeftSide}>
                <ToggleButton
                    loading={loading || !trace.isCompleted}
                    expanded={expanded}
                    onClick={handleToggle}
                    disabled={isDisabledToggle}
                    hasError={hasError}
                />
                <span className={styles.type}
                      style={{color: hasError ? ColorTheme.Red : '#000'}}>{isIf ? 'IF' : 'LOOP'}</span>
                {isLoop && <span className={styles.iterator}
                                 style={{color: hasError ? ColorTheme.Red : '#000'}}>({iterator})</span>}
                {isIf && isMouseOver && <CopyOperatorButton trace={trace} flowId={flowId} executionId={executionId}
                                             iterationIndexes={iterationIndexes} iterationIndex={iterationIndex}/>}
                {ShowIndexPath && <span style={{marginLeft: 8}}>{trace.indexPath}</span>}
            </div>
            <React.Fragment>
                {isIf && (
                    <span className={styles.ifTraceRightSide} onClick={(e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }} style={{color: hasError ? ColorTheme.Red : '#000'}}>
							{(trace.segment as DetailedIfOperatorSegment).result}
						</span>
                )}
                {isLoop && (
                    <div className={styles.loopTraceRightSide} onClick={(e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}>
                        {(trace.properties as LoopOperatorProperty).size === 0 ? <div style={{paddingRight: '5px'}}>empty</div> : <React.Fragment>
                            <LoopIterator
                                loadByIndex={loadByIndex}
                                iterationIndex={+iterationIndex + 1}
                                loopIndex={(currentLogError?.log?.properties as LoopOperatorProperty)?.loopIndex}
                                size={size}
                                hasError={hasError}
                            />
                            <FontIcon
                                isButton={true}
                                darkTheme={false}
                                size={16}
                                iconStyles={{cursor: 'pointer', color: iterationIndex === 0 || size === undefined ? theme.button.background.disable : theme.button.background.quite}}
                                disabled={iterationIndex === 0 || size === undefined}
                                isLoading={prevLoading}
                                value={'arrow_left'}
                                onClick={(e: any) => handlePrevIteration(e)}
                            />
                            <FontIcon
                                isButton={true}
                                darkTheme={false}
                                size={16}
                                iconStyles={{cursor: 'pointer', color: iterationIndex === size - 1 || size === undefined ? theme.button.background.disable : theme.button.background.quite}}
                                disabled={iterationIndex === size - 1 || size === undefined}
                                isLoading={nextLoading}
                                value={'arrow_right'}
                                onClick={(e: any) => handleNextIteration(e)}
                            />
                        </React.Fragment>
                        }
                    </div>
                )}
            </React.Fragment>
        </div>
    )
}
export default withTheme(OperatorTraceExpander);
