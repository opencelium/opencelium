import React, {useEffect, useRef, useState} from 'react';
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {deleteLogs, testConnection} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import styles from './LogsPanel/LogsPanel.module.css';
import {addNotification, setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {
    LogPanelHeight,
    setButtonPanelVisibility,
    setLogPanelHeight,
    toggleDetails
} from "@root/redux_toolkit/slices/ConnectionSlice";
import {generateUUID} from "@app_component/operator_builder/utils";
import {useSocketData} from "../../socket/SocketDataContext";
import {ConnectionSocketLog, LightSegment, LoopOperatorProperty} from "@root/requests/models/ConnectionLog";
import {
    addSocketLog,
    clearSocketLog,
    clearTextLog,
    setCurrentLog, setCurrentLogError, setIsForcedFinished,
    setIsTesting
} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {Button} from "@app_component/base/button/Button";
import {terminateExecution} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";
import {consoleLog} from "@application/utils/utils";

const TestConnectionButton = ({validateLogic}: any) => {
    const dispatch = useAppDispatch();
    const {socket} = useSocketData();
    const [channelId, setChannelId] = useState<string>(undefined);
    const [startTime, setStartTime] = useState<number>();
    const {connection} = useAppSelector((state: RootState) => state.connectionReducer);
    const {executionId, schedulerId, isTesting, currentLogError} = useAppSelector((state: RootState) => state.connectionLogReducer);
    const currentLogErrorRef = useRef<any>();
    currentLogErrorRef.current = currentLogError;
    const startTimeRef = useRef<any>();
    startTimeRef.current = startTime;
    let previousLogMessage: ConnectionSocketLog<LightSegment>;
    let isFromConnectorCompleted: boolean = false, isToConnectorCompleted: boolean = false;
    const subscriptionRef = useRef<() => void>();

    const isTestFinished = (logMessage: ConnectionSocketLog<LightSegment>): boolean => {
        if (logMessage.type === 'EXECUTION' && logMessage.status === 'COMPLETE') {
            const now = Date.now();
            const executionTime = now - startTimeRef.current;
            dispatch(addSocketLog({data: logMessage, settings: {executionTime, hasNewLoopIndex: false, parentIndexPath: ''}}));
            stopTestUrgent();
            return true;
        }
        return false;
    }
    const stopTestUrgent = () => {
        dispatch(setIsTesting(false));
        setChannelId('');
        setStartTime(0);
        subscriptionRef.current?.();
        isFromConnectorCompleted = false;
        isToConnectorCompleted = false;
    }
    const shouldSkipTrace = (logMessage: ConnectionSocketLog<LightSegment>): boolean => {
        if (!!logMessage?.error?.message) {
            if (!currentLogErrorRef.current.log) {
                dispatch(setCurrentLogError({log: logMessage, parentsPath: []}));
            } else {
                dispatch(setCurrentLogError({log: currentLogErrorRef.current.log, parentsPath: [...currentLogErrorRef.current.parentsPath, logMessage.id]}));
            }
        }
        const isPreviousLogLoop = !!(previousLogMessage?.properties as LoopOperatorProperty)?.loopIndex;
        const isCurrentLogLoop = !!(logMessage?.properties as LoopOperatorProperty)?.loopIndex;
        // if first log of the loop
        if (!isPreviousLogLoop && isCurrentLogLoop) {
            previousLogMessage = logMessage;
            return true;
        }
        // if rest logs of the loop
        if (!!isPreviousLogLoop && isCurrentLogLoop) {
            if (!((previousLogMessage.properties as LoopOperatorProperty).loopIndex !== (logMessage.properties as LoopOperatorProperty).loopIndex && (logMessage.properties as LoopOperatorProperty).loopIndex.split(',').length === 1)) {
                return true;
            }
        }
        // if flowchart completed
        const isFlowchartComplete = logMessage.type === 'FLOWCHART' && logMessage.status === 'COMPLETE';
        //const isIfComplete = logMessage.type === 'IF' && logMessage.status === 'COMPLETE'
        if (isFlowchartComplete/* || isIfComplete*/) {
            return true;
        }
    }
    useEffect(() => {
        return () => {
            dispatch(clearSocketLog());
            dispatch(setIsTesting(false));
            subscriptionRef.current?.();
        }
    }, []);

    useEffect(() => {
        if (channelId !== '') {
            if (!channelId) return;
            if (!socket || !socket.connected) {
                if (!!channelId) {
                    setChannelId('');
                }
                return;
            }
            if (subscriptionRef.current) {
                return;
            }
            const subscription = socket.subscribe(`/execution/logs/${channelId}`, (message) => {
                const data = JSON.parse(message.body) as ConnectionSocketLog<LightSegment>;
                if (data.type === 'EXECUTION' && data.status === 'PENDING') {
                    setStartTime(Date.now())
                }
                if (isTestFinished(data)) return;
                if (shouldSkipTrace(data)) return;
                let hasNewLoopIndex = false;
                if (data.indexPath) {
                    let parentIndexPath = data.indexPath.split('_').slice(0, -1).join('_')
                    const isPreviousLogLoop = !!(previousLogMessage?.properties as LoopOperatorProperty)?.loopIndex;
                    if (isPreviousLogLoop) {
                        if (!!(data.properties as LoopOperatorProperty).loopIndex) {
                            // increase size when loop iteration completed on the first level (except last iteration)
                            if ((previousLogMessage.properties as LoopOperatorProperty).loopIndex !== (data.properties as LoopOperatorProperty).loopIndex && (data.properties as LoopOperatorProperty).loopIndex.split(',').length === 1) {
                                hasNewLoopIndex = true;
                            }
                        } else {
                            // increase size when the last loop iteration completed on the first level
                            hasNewLoopIndex = true;
                            parentIndexPath = data.indexPath;
                        }
                    }
                    //@ts-ignore
                    const {size, ...properties} = data.properties
                    dispatch(addSocketLog({data: {...data, properties}, settings: {hasNewLoopIndex, parentIndexPath}}));
                    previousLogMessage = data;
                } else {
                    if (data.type === 'FLOWCHART' && data.status === 'PENDING') {
                        dispatch(addSocketLog({data, settings: {hasNewLoopIndex: false, parentIndexPath: ''}}));
                    }
                }
                if (!!data?.error?.message) {
                    if (!currentLogErrorRef.current.log) {
                        dispatch(setCurrentLogError({log: data, parentsPath: []}));
                    } else {
                        dispatch(setCurrentLogError({log: currentLogErrorRef.current.log, parentsPath: [...currentLogErrorRef.current.parentsPath, data.id]}));
                    }
                    if (channelId) {
                        stopTestUrgent();
                    }
                }
            });
            consoleLog("✅ Subscribed to /execution/logs");
            subscriptionRef.current = () => {
                setChannelId('');
                subscription.unsubscribe();
                subscriptionRef.current = undefined;
                consoleLog("🧹 Unsubscribed from /execution/logs");
            };
            startTest();
        } else {
            subscriptionRef.current?.();
        }
    }, [channelId/*, socket?.connected*/]);

    const startTest = async () => {
        if (channelId) {
            dispatch(clearTextLog());
            if (executionId) {
                dispatch(deleteLogs({executionId}));
            }
            dispatch(setIsTesting(true));
            const response = await dispatch(testConnection({connection, channelId}));
            //@ts-ignore
            if (!!response.error) {
                dispatch(setIsTesting(false));
                setChannelId('');
            } else {
                dispatch(toggleDetails(false))
                dispatch(setFullScreen(true));
                dispatch(setButtonPanelVisibility(false));
                dispatch(setLogPanelHeight(LogPanelHeight.High));
            }
        }
    }

    const stopTest = () => {
        setChannelId('');
        dispatch(toggleDetails(true))
        dispatch(setFullScreen(false));
        dispatch(setButtonPanelVisibility(true));
        dispatch(setLogPanelHeight(0));
        dispatch(terminateExecution(schedulerId));
        dispatch(setIsTesting(false));
        dispatch(setIsForcedFinished(true));
        setStartTime(0);
    }

    const generateChannelId = () => {
        dispatch(clearSocketLog());
        const testResult = validateLogic(connection);
        if(testResult.passed) {
            const channelId = generateUUID();
            setChannelId(connection.id || channelId);
        }
    }
    return (
        <Button
            id={'test_connection_button'}
            className={styles.testConnectionTitle}
            hasBackground={true}
            background={isTesting ? ColorTheme.Blue : ColorTheme.White}
            color={isTesting ? ColorTheme.White : ColorTheme.Gray}
            padding="2px 10px"
            handleClick={isTesting ? stopTest : generateChannelId}
            icon={isTesting ? "stop" : "play_arrow"}
            loadingSize={TextSize.Size_14}
            label={isTesting ? "Stop" : "Test run"}
            size={TextSize.Size_12}
        />
    )
}
export default TestConnectionButton;
