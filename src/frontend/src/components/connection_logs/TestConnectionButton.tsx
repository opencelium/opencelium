import React, {useEffect, useRef, useState} from 'react';
import {ColorTheme} from "@style/Theme";
import {TextSize} from "@app_component/base/text/interfaces";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";
import {RootState, useAppDispatch, useAppSelector} from "@application/utils/store";
import {deleteLogs, testConnection} from "@root/redux_toolkit/action_creators/ConnectionLogCreators";
import styles from './LogsPanel.module.css';
import {setFullScreen} from "@application/redux_toolkit/slices/ApplicationSlice";
import {LogPanelHeight, setButtonPanelVisibility, setLogPanelHeight} from "@root/redux_toolkit/slices/ConnectionSlice";
import {generateUUID} from "@app_component/operator_builder/utils";
import {useSocketData} from "../../socket/SocketDataContext";
import {ConnectionSocketLog} from "@root/requests/models/ConnectionLog";
import {addSocketLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {Button} from "@app_component/base/button/Button";

const TestConnectionButton = ({validateLogic}: any) => {
    const dispatch = useAppDispatch();
    const {socket} = useSocketData();
    const [isTesting, setIsTesting] = useState(false);
    const [channelId, setChannelId] = useState<string>(undefined);
    const {connection} = useAppSelector((state: RootState) => state.connectionReducer);
    const {executionId, connectionId} = useAppSelector((state: RootState) => state.connectionLogReducer);
    const subscriptionRef = useRef<() => void>();

    useEffect(() => {
        if (channelId !== '') {
            if (!channelId || !socket || !socket.connected) return;
            if (subscriptionRef.current) {
                return;
            }
            const subscription = socket.subscribe(`/execution/logs/${channelId}`, (message) => {
                const data = JSON.parse(message.body) as ConnectionSocketLog;
                console.log('Socket.ConnectionLogs', data);
                dispatch(addSocketLog(data));
            });
            console.log("✅ Subscribed to /execution/logs");
            subscriptionRef.current = () => {
                subscription.unsubscribe();
                subscriptionRef.current = undefined;
                console.log("🧹 Unsubscribed from /execution/logs");
            };
            startTest();
        } else {
            subscriptionRef.current?.();
        }
    }, [channelId]);

    const startTest = () => {
        if (channelId) {
            if (executionId && connectionId) {
                dispatch(deleteLogs({executionId, connectionId}));
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
        dispatch(setFullScreen(false));
        dispatch(setButtonPanelVisibility(true));
        dispatch(setLogPanelHeight(0));
        //dispatch(testConnection({connection, channelId: generateUUID()}));
        setIsTesting(false);
    }

    const generateChannelId = () => {
        const testResult = validateLogic(connection);
        if(testResult.passed) {
            const channelId = generateUUID();
            setChannelId(channelId);
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
            handleClick={generateChannelId}
            icon={isTesting ? "stop" : "play_arrow"}
            loadingSize={TextSize.Size_14}
            label="Test run"
            size={TextSize.Size_12}
        />
    )
}
export default TestConnectionButton;
