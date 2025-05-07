import {useEffect, useRef, useState} from "react";
import { Socket } from "socket.io-client";
import {ConnectionSocketLog} from "@root/requests/models/ConnectionLog";
import {useAppDispatch} from "@application/utils/store";
import {addSocketLog} from "@root/redux_toolkit/slices/ConnectionLogSlice";
import {Client} from "@stomp/stompjs";
import ModelCurrentSchedule from "@entity/schedule/requests/models/CurrentSchedule";
import {SocketAppPrefix} from "../socket";

export const useConnectionLogsSocket = (socket: Client | null) => {
    const dispatch = useAppDispatch();
    const [connectionLog, setConnectionLog] = useState<ConnectionSocketLog | undefined>(undefined);
    const subscriptionRef = useRef<() => void>();

    useEffect(() => {
        if (connectionLog) {
            dispatch(addSocketLog(connectionLog));
            setConnectionLog(undefined);
        }
    }, [connectionLog]);

    useEffect(() => {
        if (!socket || !socket.connected) return;
        if (subscriptionRef.current) {
            return;
        }
        const subscription = socket.subscribe(`/execution/logs`, (message) => {
            const data = JSON.parse(message.body) as ConnectionSocketLog;
            console.log('Socket.ConnectionLogs', data);
            setConnectionLog(data);
        });
        console.log("✅ Subscribed to /execution/logs");
        subscriptionRef.current = () => {
            subscription.unsubscribe();
            subscriptionRef.current = undefined;
            console.log("🧹 Unsubscribed from /execution/logs");
        };
        return () => {
            subscriptionRef.current?.();
        };
    }, [socket?.connected]);

    return { connectionLog };
};
