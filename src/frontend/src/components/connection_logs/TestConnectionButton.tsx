import React, {useEffect, useRef, useState} from 'react';
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {deleteLogs, testConnection} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import styles from './LogsPanel/LogsPanel.module.css';
import {setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {LogPanelHeight, setButtonPanelVisibility, setLogPanelHeight} from "@root/redux_toolkit/slices/ConnectionSlice";
import {generateUUID} from "@app_component/operator_builder/utils";
import {useSocketData} from "../../socket/SocketDataContext";
import {ConnectionSocketLog, LightSegment, LoopOperatorProperty} from "@root/requests/models/ConnectionLog";
import {
    addSocketLog,
    clearSocketLog,
    clearTextLog,
    setCurrentLog,
    setIsTesting
} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {Button} from "@app_component/base/button/Button";
import {terminateExecution} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";
import {consoleLog} from "@application/utils/utils";
function formatDate(date: Date): string {
    const pad = (n: number, length = 2) => n.toString().padStart(length, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // months are zero-based
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds(), 3);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
const TestConnectionButton = ({validateLogic}: any) => {
    const dispatch = useAppDispatch();
    const {socket} = useSocketData();
    const [channelId, setChannelId] = useState<string>(undefined);
    const {connection} = useAppSelector((state: RootState) => state.connectionReducer);
    const {executionId, schedulerId, isTesting} = useAppSelector((state: RootState) => state.connectionLogReducer);
    let previousLogMessage: ConnectionSocketLog<LightSegment>;
    let isFromConnectorCompleted: boolean = false, isToConnectorCompleted: boolean = false;
    const subscriptionRef = useRef<() => void>();

    const isTestFinished = (logMessage: ConnectionSocketLog<LightSegment>): boolean => {
        if (logMessage.type === 'EXECUTION' && logMessage.status === 'COMPLETE') {
            dispatch(setIsTesting(false));
            setChannelId('');
            subscriptionRef.current?.();
            isFromConnectorCompleted = false;
            isToConnectorCompleted = false;
            return true;
        }
        return false;
    }
    const shouldSkipTrace = (logMessage: ConnectionSocketLog<LightSegment>): boolean => {
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
                dispatch(setCurrentLog(data));
                console.log('Socket.ConnectionLogs', data);
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
                }
                if (!!data?.error?.message) {
                    if (channelId) {
                        setChannelId('');
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
    }, [channelId]);

    const startTest = () => {
        if (channelId) {
            dispatch(clearTextLog());
            if (executionId) {
                dispatch(deleteLogs({executionId}));
            }
            dispatch(setFullScreen(true));
            dispatch(setButtonPanelVisibility(false));
            dispatch(setLogPanelHeight(LogPanelHeight.High));
            dispatch(testConnection({connection, channelId}));
            dispatch(setIsTesting(true));
        }
    }

    const stopTest = () => {
        setChannelId('');
        //dispatch(setFullScreen(false));
        //dispatch(setButtonPanelVisibility(true));
        //dispatch(setLogPanelHeight(0));
        dispatch(terminateExecution(schedulerId));
        dispatch(setIsTesting(false));
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
