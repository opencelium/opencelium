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
import {ConnectionSocketLog, LightSegment} from "@root/requests/models/ConnectionLog";
import {addSocketLog, clearTextLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
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
    const [isTesting, setIsTesting] = useState(false);
    const [channelId, setChannelId] = useState<string>(undefined);
    const {connection} = useAppSelector((state: RootState) => state.connectionReducer);
    const {executionId, schedulerId} = useAppSelector((state: RootState) => state.connectionLogReducer);
    let previousLogMessage: ConnectionSocketLog<LightSegment> ;
    const subscriptionRef = useRef<() => void>();

    useEffect(() => {
        if (channelId !== '') {
            if (!channelId || !socket || !socket.connected) return;
            if (subscriptionRef.current) {
                return;
            }
            const subscription = socket.subscribe(`/execution/logs/${channelId}`, (message) => {
                const data = JSON.parse(message.body) as ConnectionSocketLog<LightSegment>;
                console.log('Socket.ConnectionLogs', data);
                let hasNewLoopIndex = false;
                let isLoopComplete = false;
                if (!!data.properties.loopIndex && previousLogMessage.properties.loopIndex !== data.properties.loopIndex) {
                    hasNewLoopIndex = true;
                }
                if ((data.type === 'LOOP' || data.type === 'FLOWCHART') && data.status === 'COMPLETE') {
                    return;
                }
                dispatch(addSocketLog({data, settings: {hasNewLoopIndex}}));
                previousLogMessage = data;
                if (data.type === 'EXECUTION' && data.status === 'COMPLETE') {
                    setIsTesting(false);
                    subscriptionRef.current?.();
                }
            });
            consoleLog("✅ Subscribed to /execution/logs");
            subscriptionRef.current = () => {
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
            setIsTesting(true);
        }
    }

    const stopTest = () => {
        setChannelId('');
        //dispatch(setFullScreen(false));
        //dispatch(setButtonPanelVisibility(true));
        //dispatch(setLogPanelHeight(0));
        dispatch(terminateExecution(schedulerId));
        setIsTesting(false);
    }

    const generateChannelId = () => {
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
            label="Test run"
            size={TextSize.Size_12}
        />
    )
}
export default TestConnectionButton;
